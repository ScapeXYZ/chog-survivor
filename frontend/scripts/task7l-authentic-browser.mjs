// Read-only public contract observer. No signer or genuine wallet is present.
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import {pathToFileURL} from 'node:url'
import http from 'node:http'
import {execFile} from 'node:child_process'
import {promisify} from 'node:util'
import {chromium} from 'playwright'
import {parseAbi,encodeFunctionData,decodeFunctionData,decodeFunctionResult,toFunctionSelector,parseEther,parseGwei} from 'viem'
import {approvedArtifact,collection} from './release-artifact.mjs'
const expectGameplay=process.argv.includes('--expect-gameplay')
// A persistent read-only HTTP client avoids one new DNS/TLS connection per RPC.
// Keep the old relay selectable to reproduce Task 7S's exact transport.
const relayArg=process.argv.indexOf('--rpc-transport'),rpcTransport=relayArg<0?'fetch':process.argv[relayArg+1];assert.ok(['fetch','curl'].includes(rpcTransport))
const live=process.argv.includes('--live'),arg=process.argv.indexOf('--artifact-dir'),ev=process.argv.indexOf('--evidence-dir');assert.ok(live||arg>=0,'Pass --artifact-dir or --live')
const root=arg>=0?path.resolve(process.argv[arg+1]):undefined,evidence=ev>=0?pathToFileURL(path.resolve(process.argv[ev+1])+'/'):new URL('../../docs/evidence/task7l/',import.meta.url),rpc='https://rpc.monad.xyz',game='0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390',token=1425n,run=promisify(execFile)
await fs.mkdir(new URL('screenshots/',evidence),{recursive:true})
const build=await approvedArtifact(),nftAbi=parseAbi(['function ownerOf(uint256) view returns (address)','function tokenURI(uint256) view returns (string)','function tokensOfOwner(address) view returns (uint256[])','function balanceOf(address) view returns (uint256)'])
const methods=new Set(['eth_chainId','eth_blockNumber','eth_getBlockByNumber','eth_getCode','eth_call','eth_getLogs','eth_estimateGas','eth_getBalance','eth_getTransactionCount','eth_maxPriorityFeePerGas','eth_gasPrice'])
const selectors=new Set([...build.artifact.abi,...nftAbi].filter(x=>x.type==='function'&&['view','pure'].includes(x.stateMutability)).map(toFunctionSelector))
const transcript=[],walletCalls=[],checks=[],errors=[],diagnostics=[],reviewTimings=[];let rejectRPC=false,logs=0,refreshRace=false
const check=(name,value)=>{assert.ok(value,name);checks.push(name)}
async function read({method,params=[]}){
 assert.ok(methods.has(method),'Forbidden RPC method '+method)
 if(['eth_call','eth_estimateGas'].includes(method)){const tx=params[0];assert.ok([game,collection].some(x=>x.toLowerCase()===tx.to.toLowerCase()));if(!selectors.has(tx.data.slice(0,10))||method==='eth_estimateGas'){assert.ok(expectGameplay&&tx.to.toLowerCase()===game.toLowerCase(),'Only approved read-only gameplay simulation');const decoded=decodeFunctionData({abi:build.artifact.abi,data:tx.data});assert.equal(decoded.functionName,'act');assert.equal(decoded.args[0],token);assert.ok([1,2,3].includes(Number(decoded.args[1])));assert.equal(BigInt(tx.value??0),0n)}}
 if(method==='eth_getLogs'){assert.equal(params[0].address.toLowerCase(),game.toLowerCase());assert.ok(BigInt(params[0].toBlock)-BigInt(params[0].fromBlock)<100n);if(++logs>40)throw Error('Browser history observation budget exhausted')}
 if(process.argv.includes('--discovery-failure')&&method==='eth_call'&&params[0].data.startsWith(toFunctionSelector('tokensOfOwner(address)')))throw Error('Intentional discovery outage; manual ownerOf remains live')
 if(rejectRPC)throw Error('Intentional test of RPC unavailability')
 if(refreshRace&&((method==='eth_getBlockByNumber'&&params[0]==='finalized')||(method==='eth_call'&&params[0].data.startsWith('0x6352211e'))))await new Promise(r=>setTimeout(r,12000));const started=Date.now();if(method==='eth_estimateGas'&&process.argv.includes('--delay-estimate'))await new Promise(r=>setTimeout(r,35000));let stdout;try{if(rpcTransport==='fetch'){const response=await fetch(rpc,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error(`RPC HTTP ${response.status}`);stdout=await response.text()}else ({stdout}=await run('curl',['--silent','--show-error','--fail-with-body','--connect-timeout','5','--max-time','20','-H','Content-Type: application/json','--data-binary',JSON.stringify({jsonrpc:'2.0',id:1,method,params}),rpc],{maxBuffer:2000000}))}catch(error){transcript.push({method,elapsedMs:Date.now()-started,error:error.message});throw error}
 if(method==='eth_estimateGas'&&process.argv.includes('--refresh-during-estimate')){refreshRace=true;await activePage.evaluate(()=>dispatchEvent(new Event('focus')));await new Promise(r=>setTimeout(r,150))};const reply=JSON.parse(stdout);transcript.push({method,elapsedMs:Date.now()-started,ok:!reply.error,error:reply.error});if(reply.error)throw Error(JSON.stringify(reply.error));return reply.result
}
const call=async(to,abi,functionName,args=[])=>decodeFunctionResult({abi,functionName,data:await read({method:'eth_call',params:[{to,data:encodeFunctionData({abi,functionName,args})},'finalized']})})
const observedOwner=await call(collection,nftAbi,'ownerOf',[token]);const actualState=await call(game,build.artifact.abi,'characterOf',[token]);const actualTitle=await call(game,build.artifact.abi,'titleOf',[token])
let browser, activePage
const server=live?undefined:http.createServer(async(req,res)=>{try{const target=path.resolve(root,'.'+(req.url==='/'?'/index.html':req.url.split('?')[0]));assert.ok(target.startsWith(root+'/'));res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.ttf':'font/ttf'})[path.extname(target)]??'application/octet-stream');res.end(await fs.readFile(target))}catch{res.writeHead(404);res.end()}})
if(server)await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=live?'https://chog-survivor.vercel.app':`http://127.0.0.1:${server.address().port}`
try{browser=await chromium.launch({headless:true});for(const width of (process.argv.includes('--desktop-only')?[1440]:[1440,375])){
 let connected=false,chain='0x8f';rejectRPC=false
 const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce',serviceWorkers:'block'})
 await context.exposeBinding('__observer',(_,r)=>{walletCalls.push(r.method);if(r.method==='eth_chainId')return chain;if(r.method==='eth_accounts')return connected?[observedOwner]:[];if(r.method==='eth_requestAccounts'){connected=true;return[observedOwner]}if(['wallet_getPermissions','wallet_requestPermissions'].includes(r.method))return[];throw Error('FORBIDDEN wallet signing/write '+r.method)})
 await context.addInitScript(()=>{const listeners={};const provider={on:(k,f)=>(listeners[k]??=[]).push(f),removeListener:(k,f)=>listeners[k]=listeners[k]?.filter(x=>x!==f),request:r=>window.__observer(r)};window.__networkChanged=()=>listeners.chainChanged?.forEach(f=>f('0x1'));const announce=()=>dispatchEvent(new CustomEvent('eip6963:announceProvider',{detail:{info:{uuid:'44444444-4444-4444-8444-444444444444',rdns:'test.chog.readonly',name:'PUBLIC ADDRESS OBSERVER — NO SIGNER',icon:'data:image/svg+xml,<svg/>'},provider}}));addEventListener('eip6963:requestProvider',announce);announce()})
 await context.route('**/*',async route=>{const req=route.request(),url=new URL(req.url());if(url.origin===origin&&req.method()==='GET')return route.continue();if(url.origin===rpc&&req.method()==='POST'){const respond=async r=>{try{return{jsonrpc:'2.0',id:r.id,result:await read(r)}}catch(error){return{jsonrpc:'2.0',id:r.id,error:{code:-32000,message:error.message}}}};const body=req.postDataJSON();return route.fulfill({json:Array.isArray(body)?await Promise.all(body.map(respond)):await respond(body)})}return route.abort()})
 const page=await context.newPage();activePage=page;page.setDefaultTimeout(90000);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>diagnostics.push({type:m.type(),text:m.text()}));await page.goto(origin)
 for(const screen of ['home','adventure','character','settings']){
  if(screen!=='home')await page.getByRole('button',{name:new RegExp('^'+screen+'$','i')}).click()
  check(`${width} ${screen}: no fabricated labels or seed`,!await page.getByText(/^(DEMO STATS|LOCAL DEMO|Demo unlocked|Simulated trail|Demo seed|Simulated chronicle)/i).count())
  check(`${width} ${screen}: fits viewport`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
  if(screen==='adventure'){check(`${width}: empty HUD has four unavailable values`,await page.getByLabel('Recorded survivor statistics').getByText('Unavailable',{exact:true}).count()===4);check(`${width}: no walletless action request`,expectGameplay?await page.locator('.mainnet-gameplay .adventure-choice').count()===0&&await page.getByRole('button',{name:'Request wallet confirmation',exact:true}).count()===0:await page.getByRole('button',{name:'On-chain gameplay not yet enabled',exact:true}).isDisabled())}
  await page.screenshot({path:new URL(`screenshots/${width}-${screen}-empty.png`,evidence).pathname})
 }
 check(`${width}: no automatic wallet connection`,!connected)
 await page.locator('.game-header .wallet').click();await page.getByRole('button',{name:'PUBLIC ADDRESS OBSERVER — NO SIGNER',exact:true}).click();await page.locator('.game-header .wallet').filter({hasText:/Disconnect/}).waitFor()
 if(expectGameplay){
  await page.getByRole('button',{name:/^adventure$/i}).click()
  const picker=page.getByLabel('Choose your survivor')
  if(process.argv.includes('--discovery-failure')){await picker.getByRole('status').filter({hasText:/^Discovery unavailable:/}).waitFor({timeout:20000});check(`${width}: failed discovery claims no owned NFT`,await picker.getByRole('button',{name:/^CHOG #/}).count()===0)}
  else {await picker.getByRole('button',{name:/^CHOG #/}).first().waitFor({timeout:20000});check(`${width}: automatic discovery verifies selectable owned NFTs`,await picker.getByRole('button',{name:/^CHOG #/,pressed:true}).count()===1)}
  await page.screenshot({path:new URL(`screenshots/${width}-automatic-discovery.png`,evidence).pathname})
  const owned=picker.getByRole('button',{name:`CHOG #${token}`,exact:true})
  if(await owned.count())await owned.click()
  else {await picker.locator('summary').click();await picker.getByLabel('Survivor token ID',{exact:true}).fill(token.toString());await picker.getByRole('button',{name:'Select survivor',exact:true}).click()}
  await page.getByRole('button',{name:/^character$/i}).click()
 }else {await page.getByRole('button',{name:/^character$/i}).click();await page.getByLabel('Token ID',{exact:true}).fill(token.toString());await page.getByRole('button',{name:'Check token',exact:true}).click()}

 await page.getByText(actualState.xp.toLocaleString(),{exact:true}).first().waitFor()
 check(`${width}: actual owner displayed`,await page.getByText(observedOwner,{exact:true}).isVisible())
 for(const [label,value]of [['Trust',actualState.trust],['Scars',actualState.scars]])check(`${width}: ${label} matches chain`,await page.getByRole('meter',{name:label}).getAttribute('value')===String(value))
 check(`${width}: earned count matches actual mask`,await page.getByText('Earned',{exact:true}).count()===actualState.achievementMask.toString(2).split('1').length-1)
 await page.screenshot({path:new URL(`screenshots/${width}-character-observer.png`,evidence).pathname,fullPage:true})
 await page.getByRole('button',{name:/^adventure$/i}).click();await page.getByLabel('Recorded survivor statistics').locator('dd').filter({hasText:new RegExp('^'+actualState.xp+'$')}).first().waitFor()
 check(`${width}: expected authorized gameplay mode`,expectGameplay?await page.getByRole('heading',{name:'One Chog. One daily decision.'}).isVisible():await page.getByRole('button',{name:'On-chain gameplay not yet enabled',exact:true}).isDisabled());check(`${width}: connected view fits`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
 await page.screenshot({path:new URL(`screenshots/${width}-adventure-observer.png`,evidence).pathname})
 if(expectGameplay){
  const eligible=await call(game,build.artifact.abi,'preview',[token,1]);
  if(eligible.canAct){
   const reviewStarted=performance.now();await page.locator('.mainnet-gameplay .adventure-choice:enabled').first().click();const dialog=page.getByRole('dialog',{name:'Review real Monad action'});try{await dialog.waitFor({timeout:10000})}catch(error){await fs.writeFile(new URL('review-failure.json',evidence),JSON.stringify({message:error.message,status:await page.locator('.mainnet-gameplay').innerText(),errors,diagnostics,transcript,walletCalls},null,2));await page.screenshot({path:new URL('screenshots/review-failure.png',evidence).pathname,fullPage:true});throw error};
   const openedMs=Math.round(performance.now()-reviewStarted);check(`${width}: unsigned review opens within 10 seconds`,openedMs<10000);
   if(process.argv.includes('--delay-estimate')||process.argv.includes('--refresh-during-estimate')){await dialog.getByRole('alert').waitFor({timeout:10000});check(`${width}: unavailable preflight fails closed in visible review`,await dialog.getByRole('button',{name:'Request wallet confirmation',exact:true}).isDisabled());reviewTimings.push({width,openedMs,error:await dialog.getByRole('alert').innerText()})}
   else {await dialog.getByText('Maximum potential cost',{exact:true}).waitFor({timeout:Math.max(1,10000-(performance.now()-reviewStarted))});const quoteReadyMs=Math.round(performance.now()-reviewStarted);check(`${width}: fully verified fee quote within 10 seconds`,quoteReadyMs<10000);const field=async label=>dialog.locator('dt').filter({hasText:new RegExp('^'+label+'$')}).locator('xpath=following-sibling::dd[1]').innerText();const gasText=await field('Estimated gas / limit'),feeText=await field('Maximum fee / priority per gas'),costText=await field('Maximum potential cost'),reserveText=await field('Minimum reserve / expected reserve at maximum cost');const [estimate,limit]=gasText.split(' / ').map(BigInt),[fee,priority]=feeText.replace(' gwei','').split(' / ').map(value=>parseGwei(value)),cost=parseEther(costText.replace(' MON','')),[minimum,reserve]=reserveText.replace(' MON','').split(' / ').map(value=>parseEther(value));check(`${width}: displayed quote enforces all approved spending limits`,estimate>0n&&limit<=400000n&&fee>0n&&priority>=0n&&priority<=fee&&fee<=125000000000n&&cost===limit*fee&&cost<=50000000000000000n&&minimum===100000000000000000n&&reserve>=minimum);reviewTimings.push({width,openedMs,quoteReadyMs,gasText,feeText,costText,reserveText})}
   check(`${width}: exact zero-value act review`,await dialog.filter({hasText:`act(${token}, 1)`}).filter({hasText:game}).filter({hasText:'0 MON'}).isVisible());
   check(`${width}: explicit confirmation initially disabled`,await page.getByRole('button',{name:'Request wallet confirmation',exact:true}).isDisabled());
   await dialog.evaluate(d=>{d.scrollTop=0});await page.screenshot({path:new URL(`screenshots/${width}-unsigned-review.png`,evidence).pathname});
   if(!process.argv.includes('--delay-estimate')&&!process.argv.includes('--refresh-during-estimate')){await dialog.getByText('Maximum potential cost',{exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:new URL(`screenshots/${width}-unsigned-review-fees.png`,evidence).pathname})};await page.getByRole('button',{name:'Cancel review',exact:true}).click();check(`${width}: review cancelled without wallet signing/send request`,!walletCalls.some(x=>/send|sign/i.test(x)));
  }else check(`${width}: chain daily lock prevents action`,await page.locator('.mainnet-gameplay .adventure-choice:enabled').count()===0)
 }
 if(width===1440){rejectRPC=true;await page.evaluate(()=>dispatchEvent(new Event('focus')));await page.getByLabel('Recorded survivor statistics').getByText('Unavailable',{exact:true}).first().waitFor();check('RPC failure clears stats without fallback',await page.getByLabel('Recorded survivor statistics').getByText('Unavailable',{exact:true}).count()===4);rejectRPC=false}
 chain='0x1';await page.evaluate(()=>window.__networkChanged());await page.getByLabel('Recorded survivor statistics').getByText('Unavailable',{exact:true}).first().waitFor();check(`${width}: network switch clears state`,await page.getByLabel('Recorded survivor statistics').getByText('Unavailable',{exact:true}).count()===4)
 await context.close()
 }
 check('wallet methods contain no signing/broadcast',walletCalls.every(x=>['eth_chainId','eth_accounts','eth_requestAccounts','wallet_getPermissions','wallet_requestPermissions'].includes(x)));check('no page errors',errors.length===0)
 console.log(JSON.stringify({status:'PASS',expectGameplay,rpcTransport,origin,checkedAt:new Date().toISOString(),checks:checks.length,names:checks,screenshots:expectGameplay?14:12,liveReadOnlyRPC:true,publicSampleToken:token.toString(),actualState,actualTitle,observerUsesPublicAddressOnly:true,accountControlProven:false,genuineWalletConnected:false,signatureOrBroadcast:false,walletCalls,reviewTimings,diagnostics,rpcSummary:transcript},(_,v)=>typeof v==='bigint'?v.toString():v,2))
}catch(error){await fs.writeFile(new URL('failure.json',evidence),JSON.stringify({message:error.message,body:await activePage?.locator('body').innerText().catch(()=>''),errors,diagnostics,transcript,walletCalls},null,2));throw error}finally{await browser?.close();if(server)await new Promise(resolve=>server.close(resolve))}
