// Read-only public contract observer. No signer or genuine wallet is present.
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import {pathToFileURL} from 'node:url'
import http from 'node:http'
import {execFile} from 'node:child_process'
import {promisify} from 'node:util'
import {chromium} from 'playwright'
import {parseAbi,encodeFunctionData,decodeFunctionResult,toFunctionSelector} from 'viem'
import {approvedArtifact,collection} from './release-artifact.mjs'
const live=process.argv.includes('--live'),arg=process.argv.indexOf('--artifact-dir'),ev=process.argv.indexOf('--evidence-dir');assert.ok(live||arg>=0,'Pass --artifact-dir or --live')
const root=arg>=0?path.resolve(process.argv[arg+1]):undefined,evidence=ev>=0?pathToFileURL(path.resolve(process.argv[ev+1])+'/'):new URL('../../docs/evidence/task7l/',import.meta.url),rpc='https://rpc.monad.xyz',game='0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390',token=1425n,run=promisify(execFile)
await fs.mkdir(new URL('screenshots/',evidence),{recursive:true})
const build=await approvedArtifact(),nftAbi=parseAbi(['function ownerOf(uint256) view returns (address)','function tokenURI(uint256) view returns (string)'])
const methods=new Set(['eth_chainId','eth_blockNumber','eth_getBlockByNumber','eth_getCode','eth_call','eth_getLogs'])
const selectors=new Set([...build.artifact.abi,...nftAbi].filter(x=>x.type==='function'&&['view','pure'].includes(x.stateMutability)).map(toFunctionSelector))
const transcript=[],walletCalls=[],checks=[],errors=[];let rejectRPC=false,logs=0
const check=(name,value)=>{assert.ok(value,name);checks.push(name)}
async function read({method,params=[]}){
 assert.ok(methods.has(method),'Forbidden RPC method '+method)
 if(method==='eth_call'){assert.ok([game,collection].some(x=>x.toLowerCase()===params[0].to.toLowerCase()));assert.ok(selectors.has(params[0].data.slice(0,10)),'Write selector forbidden')}
 if(method==='eth_getLogs'){assert.equal(params[0].address.toLowerCase(),game.toLowerCase());assert.ok(BigInt(params[0].toBlock)-BigInt(params[0].fromBlock)<100n);if(++logs>40)throw Error('Browser history observation budget exhausted')}
 if(rejectRPC)throw Error('Intentional test of RPC unavailability')
 const {stdout}=await run('curl',['--silent','--show-error','--fail-with-body','--connect-timeout','5','--max-time','20','-H','Content-Type: application/json','--data-binary',JSON.stringify({jsonrpc:'2.0',id:1,method,params}),rpc],{maxBuffer:2000000})
 const reply=JSON.parse(stdout);transcript.push({method,ok:!reply.error});if(reply.error)throw Error(JSON.stringify(reply.error));return reply.result
}
const call=async(to,abi,functionName,args=[])=>decodeFunctionResult({abi,functionName,data:await read({method:'eth_call',params:[{to,data:encodeFunctionData({abi,functionName,args})},'finalized']})})
const observedOwner=await call(collection,nftAbi,'ownerOf',[token]);const actualState=await call(game,build.artifact.abi,'characterOf',[token]);const actualTitle=await call(game,build.artifact.abi,'titleOf',[token])
let browser
const server=live?undefined:http.createServer(async(req,res)=>{try{const target=path.resolve(root,'.'+(req.url==='/'?'/index.html':req.url.split('?')[0]));assert.ok(target.startsWith(root+'/'));res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.ttf':'font/ttf'})[path.extname(target)]??'application/octet-stream');res.end(await fs.readFile(target))}catch{res.writeHead(404);res.end()}})
if(server)await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=live?'https://chog-survivor.vercel.app':`http://127.0.0.1:${server.address().port}`
try{browser=await chromium.launch({headless:true});for(const width of [1440,375]){
 let connected=false,chain='0x8f';rejectRPC=false
 const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce',serviceWorkers:'block'})
 await context.exposeBinding('__observer',(_,r)=>{walletCalls.push(r.method);if(r.method==='eth_chainId')return chain;if(r.method==='eth_accounts')return connected?[observedOwner]:[];if(r.method==='eth_requestAccounts'){connected=true;return[observedOwner]}if(['wallet_getPermissions','wallet_requestPermissions'].includes(r.method))return[];throw Error('FORBIDDEN wallet signing/write '+r.method)})
 await context.addInitScript(()=>{const listeners={};const provider={on:(k,f)=>(listeners[k]??=[]).push(f),removeListener:(k,f)=>listeners[k]=listeners[k]?.filter(x=>x!==f),request:r=>window.__observer(r)};window.__networkChanged=()=>listeners.chainChanged?.forEach(f=>f('0x1'));const announce=()=>dispatchEvent(new CustomEvent('eip6963:announceProvider',{detail:{info:{uuid:'44444444-4444-4444-8444-444444444444',rdns:'test.chog.readonly',name:'PUBLIC ADDRESS OBSERVER — NO SIGNER',icon:'data:image/svg+xml,<svg/>'},provider}}));addEventListener('eip6963:requestProvider',announce);announce()})
 await context.route('**/*',async route=>{const req=route.request(),url=new URL(req.url());if(url.origin===origin&&req.method()==='GET')return route.continue();if(url.origin===rpc&&req.method()==='POST'){const respond=async r=>{try{return{jsonrpc:'2.0',id:r.id,result:await read(r)}}catch(error){return{jsonrpc:'2.0',id:r.id,error:{code:-32000,message:error.message}}}};const body=req.postDataJSON();return route.fulfill({json:Array.isArray(body)?await Promise.all(body.map(respond)):await respond(body)})}return route.abort()})
 const page=await context.newPage();page.setDefaultTimeout(45000);page.on('pageerror',e=>errors.push(e.message));await page.goto(origin)
 for(const screen of ['home','adventure','character','settings']){
  if(screen!=='home')await page.getByRole('button',{name:new RegExp('^'+screen+'$','i')}).click()
  check(`${width} ${screen}: no fabricated labels or seed`,!await page.getByText(/^(DEMO STATS|LOCAL DEMO|Demo unlocked|Simulated trail|Demo seed|Simulated chronicle)/i).count())
  check(`${width} ${screen}: fits viewport`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
  if(screen==='adventure'){check(`${width}: empty HUD has four unavailable values`,await page.getByLabel('Recorded survivor statistics').getByText('Unavailable',{exact:true}).count()===4);check(`${width}: live action disabled`,await page.getByRole('button',{name:'On-chain gameplay not yet enabled',exact:true}).isDisabled())}
  await page.screenshot({path:new URL(`screenshots/${width}-${screen}-empty.png`,evidence).pathname})
 }
 check(`${width}: no automatic wallet connection`,!connected)
 await page.locator('.game-header .wallet').click();await page.getByRole('button',{name:'PUBLIC ADDRESS OBSERVER — NO SIGNER',exact:true}).click();await page.locator('.game-header .wallet').filter({hasText:/Disconnect/}).waitFor()
 await page.getByRole('button',{name:/^character$/i}).click();await page.getByLabel('Token ID').fill(token.toString());await page.getByRole('button',{name:'Check token',exact:true}).click()
 await page.getByText(actualState.xp.toLocaleString(),{exact:true}).first().waitFor()
 check(`${width}: actual owner displayed`,await page.getByText(observedOwner,{exact:true}).isVisible())
 for(const [label,value]of [['Trust',actualState.trust],['Scars',actualState.scars]])check(`${width}: ${label} matches chain`,await page.getByRole('meter',{name:label}).getAttribute('value')===String(value))
 check(`${width}: earned count matches actual mask`,await page.getByText('Earned',{exact:true}).count()===actualState.achievementMask.toString(2).split('1').length-1)
 await page.screenshot({path:new URL(`screenshots/${width}-character-observer.png`,evidence).pathname,fullPage:true})
 await page.getByRole('button',{name:/^adventure$/i}).click();await page.getByLabel('Recorded survivor statistics').locator('dd').filter({hasText:new RegExp('^'+actualState.xp+'$')}).first().waitFor()
 check(`${width}: authentic Adventure remains read-only`,await page.getByRole('button',{name:'On-chain gameplay not yet enabled',exact:true}).isDisabled());check(`${width}: connected view fits`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
 await page.screenshot({path:new URL(`screenshots/${width}-adventure-observer.png`,evidence).pathname})
 if(width===1440){rejectRPC=true;await page.evaluate(()=>dispatchEvent(new Event('focus')));await page.getByLabel('Recorded survivor statistics').getByText('Unavailable',{exact:true}).first().waitFor();check('RPC failure clears stats without fallback',await page.getByLabel('Recorded survivor statistics').getByText('Unavailable',{exact:true}).count()===4);rejectRPC=false}
 chain='0x1';await page.evaluate(()=>window.__networkChanged());await page.getByLabel('Recorded survivor statistics').getByText('Unavailable',{exact:true}).first().waitFor();check(`${width}: network switch clears state`,await page.getByLabel('Recorded survivor statistics').getByText('Unavailable',{exact:true}).count()===4)
 await context.close()
 }
 check('wallet methods contain no signing/broadcast',walletCalls.every(x=>['eth_chainId','eth_accounts','eth_requestAccounts','wallet_getPermissions','wallet_requestPermissions'].includes(x)));check('no page errors',errors.length===0)
 console.log(JSON.stringify({status:'PASS',origin,checkedAt:new Date().toISOString(),checks:checks.length,names:checks,screenshots:12,liveReadOnlyRPC:true,publicSampleToken:token.toString(),actualState,actualTitle,observerUsesPublicAddressOnly:true,accountControlProven:false,genuineWalletConnected:false,signatureOrBroadcast:false,walletCalls,rpcSummary:transcript},(_,v)=>typeof v==='bigint'?v.toString():v,2))
}finally{await browser?.close();if(server)await new Promise(resolve=>server.close(resolve))}
