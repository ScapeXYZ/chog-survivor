// Actual frontend + live mainnet reads. Public observer identity only; no signer exists.
// Every wallet signing/write method and every mutating RPC method is rejected.
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import http from 'node:http'
import {execFile} from 'node:child_process'
import {promisify} from 'node:util'
import {chromium} from 'playwright'
import {decodeFunctionResult,encodeFunctionData,keccak256,parseAbi,toFunctionSelector} from 'viem'
import {approvedArtifact,collection} from './release-artifact.mjs'
const index=process.argv.indexOf('--artifact-dir');if(index<0)throw Error('Pass the reviewed mainnet --artifact-dir')
const root=path.resolve(process.argv[index+1]),run=promisify(execFile),build=await approvedArtifact()
const game='0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390',url='https://rpc.monad.xyz',token=1425n
const nftAbi=parseAbi(['function ownerOf(uint256) view returns (address)','function tokenURI(uint256) view returns (string)'])
const allowedMethods=new Set(['eth_chainId','eth_blockNumber','eth_getBlockByNumber','eth_getCode','eth_call','eth_getLogs'])
const selectors=new Set([...build.artifact.abi,...nftAbi].filter(x=>x.type==='function'&&['view','pure'].includes(x.stateMutability)).map(toFunctionSelector))
const transcript=[],walletCalls=[],checks=[],errors=[];let firstLogResolve
const firstLog=new Promise(resolve=>{firstLogResolve=resolve})
async function read(request){
 const {method,params=[]}=request
 assert.ok(allowedMethods.has(method),'Forbidden RPC method '+method)
 if(method==='eth_call'){assert.ok([game,collection].some(a=>a.toLowerCase()===params[0].to?.toLowerCase()),'Unexpected call target');assert.ok(selectors.has(params[0].data.slice(0,10)),'Forbidden function selector')}
 if(method==='eth_getCode')assert.ok([game,collection].some(a=>a.toLowerCase()===params[0].toLowerCase()))
 if(method==='eth_getLogs'){assert.equal(params[0].address.toLowerCase(),game.toLowerCase());assert.ok(BigInt(params[0].toBlock)-BigInt(params[0].fromBlock)<100n);assert.ok(BigInt(params[0].fromBlock)>=113947533n)}
 assert.ok(transcript.length<80,'Read-only smoke request budget exhausted')
 const {stdout}=await run('curl',['--silent','--show-error','--fail-with-body','--connect-timeout','5','--max-time','20','-H','Content-Type: application/json','--data-binary',JSON.stringify({jsonrpc:'2.0',id:request.id??1,method,params}),url],{maxBuffer:2*1024*1024})
 const reply=JSON.parse(stdout);transcript.push({at:new Date().toISOString(),method,params,reply})
 if(reply.error)throw Error(JSON.stringify(reply.error))
 if(method==='eth_getLogs')firstLogResolve(reply.result)
 return reply.result
}
const check=(name,value)=>{assert.ok(value,name);checks.push(name)}
const abi=build.artifact.abi
let browser,server,page
try{
 check('read-only RPC reports chain 143',await read({method:'eth_chainId'})==='0x8f')
 const code=await read({method:'eth_getCode',params:[game,'finalized']});check('current full runtime equals frozen artifact',code===build.runtime&&keccak256(code)===build.runtimeCodeHash)
 const ownerResult=await read({method:'eth_call',params:[{to:collection,data:encodeFunctionData({abi:nftAbi,functionName:'ownerOf',args:[token]})},'finalized']})
 const observedOwner=decodeFunctionResult({abi:nftAbi,functionName:'ownerOf',data:ownerResult})
 server=http.createServer(async(req,res)=>{try{const target=path.resolve(root,'.'+(req.url==='/'?'/index.html':req.url.split('?')[0]));if(!target.startsWith(root+'/'))throw Error('Invalid path');res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.ttf':'font/ttf','.webp':'image/webp'})[path.extname(target)]??'application/octet-stream');res.end(await fs.readFile(target))}catch{res.writeHead(404);res.end()}})
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`
 browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block',reducedMotion:'reduce'})
 let connected=false
 await context.exposeBinding('__readOnlyObserver',async(_,request)=>{
  walletCalls.push(request.method)
  if(request.method==='eth_chainId')return'0x8f'
  if(request.method==='eth_accounts')return connected?[observedOwner]:[]
  if(request.method==='eth_requestAccounts'){connected=true;return[observedOwner]}
  if(request.method==='wallet_getPermissions'||request.method==='wallet_requestPermissions')return[]
  throw Error('FORBIDDEN: observer cannot sign, switch, approve or send '+request.method)
 })
 await context.addInitScript(()=>{
  const provider={on(){},removeListener(){},request:r=>window.__readOnlyObserver(r)}
  const announce=()=>window.dispatchEvent(new CustomEvent('eip6963:announceProvider',{detail:{info:{uuid:'33333333-3333-4333-8333-333333333333',rdns:'test.chog.readonly',name:'PUBLIC ADDRESS OBSERVER — NO SIGNER',icon:'data:image/svg+xml,<svg/>'},provider}}))
  window.addEventListener('eip6963:requestProvider',announce);announce()
 })
 await context.route('**/*',async route=>{
  const request=route.request(),target=new URL(request.url())
  if(target.origin===origin)return route.continue()
  if(target.origin===url&&request.method()==='POST'){
   const answer=async item=>{try{return{jsonrpc:'2.0',id:item.id,result:await read(item)}}catch(e){return{jsonrpc:'2.0',id:item.id,error:{code:-32000,message:e.message}}}}
   const body=request.postDataJSON();return route.fulfill({json:Array.isArray(body)?await Promise.all(body.map(answer)):await answer(body)})
  }
  return route.abort()
 })
 page=await context.newPage();page.setDefaultTimeout(45000);page.on('pageerror',e=>errors.push(e.message))
 await page.goto(origin);await page.getByRole('button',{name:/enter the wild/i}).click()
 check('live-capable candidate defaults to walletless simulation',await page.getByText('DEMO STATS — NOT SAVED').isVisible())
 check('navigation never requested account permission or writes',!connected&&!walletCalls.some(m=>['eth_requestAccounts','wallet_requestPermissions','eth_sendTransaction','personal_sign','eth_signTypedData_v4'].includes(m)))
 await page.locator('.game-header .wallet').click()
 const observerOption=page.getByRole('button',{name:'PUBLIC ADDRESS OBSERVER — NO SIGNER',exact:true}),connectedHeader=page.locator('.game-header .wallet').filter({hasText:/Disconnect/i})
 await observerOption.or(connectedHeader).waitFor();if(await observerOption.isVisible())await observerOption.click();await connectedHeader.waitFor()
 await page.getByRole('button',{name:/^character$/i}).click()
 await page.getByLabel('Token ID').fill(token.toString());await page.getByRole('button',{name:'Check token',exact:true}).click()
 await page.getByRole('heading',{name:'CHOG #1425',exact:true}).waitFor()
 await page.getByText('Recorded contract state · Monad mainnet. Actions require explicit wallet confirmation.',{exact:true}).waitFor()
 check('actual frontend reads verified NFT owner and deployed character',await page.getByText(observedOwner,{exact:true}).isVisible())
 const bindingReads=transcript.filter(x=>x.method==='eth_call'&&x.params[0].to.toLowerCase()===game.toLowerCase()&&x.params[0].data.startsWith(encodeFunctionData({abi,functionName:'CHOG_GENESIS'})))
 check('actual frontend uses deployed game binding getter',bindingReads.length>0&&bindingReads.every(x=>decodeFunctionResult({abi,functionName:'CHOG_GENESIS',data:x.reply.result}).toLowerCase()===collection.toLowerCase()))
 let historyTimer
 try{await Promise.race([firstLog,new Promise((_,reject)=>{historyTimer=setTimeout(()=>reject(Error('No successful live history page within 30 seconds')),30000)})])}finally{clearTimeout(historyTimer)}
 check('actual history RPC uses game address and bounded post-deployment blocks',transcript.some(x=>x.method==='eth_getLogs'&&!x.reply.error))
 check('profile remains within desktop viewport',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
 check('no signing, transaction preparation or wallet write requested',walletCalls.every(m=>['eth_chainId','eth_accounts','eth_requestAccounts','wallet_getPermissions','wallet_requestPermissions'].includes(m)))
 check('no uncaught page errors',errors.length===0)
 await context.close()
 console.log(JSON.stringify({status:'PASS',checks:checks.length,names:checks,liveReads:true,rpc:url,game,collection,tokenId:token.toString(),observerAddress:observedOwner,observerIsSyntheticPublicIdentity:true,accountControlProven:false,realWalletUsed:false,signingAndBroadcastMethodsForbidden:true,historyScope:'First successful bounded live page only; not a full historical scan',walletCalls,transcript},null,2))
}catch(error){await fs.writeFile(new URL('../../docs/evidence/task7b/live-read-diagnostic-'+Date.now()+'.json',import.meta.url),JSON.stringify({error:error.message,walletCalls,transcript,body:page?await page.locator('main').innerText().catch(()=>'unavailable'):'not opened'},null,2));throw error}finally{await browser?.close();if(server)await new Promise(resolve=>server.close(resolve))}
