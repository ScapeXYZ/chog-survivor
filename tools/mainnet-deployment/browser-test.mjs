// Isolated synthetic-provider validation. All external browser requests are blocked.
import assert from 'node:assert/strict'
import http from 'node:http'
import {createRequire} from 'node:module'
import {createReviewServer,loadConfig} from './server.mjs'
import {expected,collectionRuntimeHash,walletRequest,riskKeys,ownerAcceptancePhrase} from './model.mjs'
const require=createRequire(new URL('../../frontend/package.json',import.meta.url)),{chromium}=require('playwright')
const config=await loadConfig(),checks=[]
const check=(name,value)=>{assert.ok(value,name);checks.push(name)}
const hostileHostStatus=url=>new Promise((resolve,reject)=>{const request=http.request(url,{headers:{host:'attacker.invalid'}},response=>{response.resume();resolve(response.statusCode)});request.on('error',reject);request.end()})
const quote=()=>({sourceSHA256:expected.sourceHash,artifactSHA256:expected.artifactHash,creationHash:expected.creationHash,nftBinding:expected.collection,bothCreationSimulationsMatch:true,chainId:143,checkedAt:Date.now(),independentMatches:true,latestNonce:'0',pendingNonce:'0',senderCode:'0x',expectedAddressCode:'0x',collectionRuntimeHash,creationRuntimeHash:expected.runtimeHash,balanceWei:'400000000000000000',estimateGas:'1510761',baseFeePerGas:'100000000000'})
const authorization={status:'AUTHORIZED_ONE_ATTEMPT',candidateSHA256:expected.candidateSHA256,signingPayloadKeccak256:expected.signingDigest,expiresAt:new Date(Date.now()+300000).toISOString(),references:{independentSecurity:'SYNTHETIC TEST ONLY',governanceCustody:'SYNTHETIC TEST ONLY',warningPolicy:'SYNTHETIC TEST ONLY',transactionApproval:'SYNTHETIC TEST ONLY'}}
let browser;const servers=[]
try {
 browser=await chromium.launch({headless:true})
 for(const mode of ['locked','synthetic-authorized','wrong-chain','owner-unaudited','owner-account-change','owner-chain-change']) {
  let reads=0
  const server=await createReviewServer({config:mode==='locked'||mode.startsWith('owner-')?config:{...config,authorization},preflight:async()=>{reads++;return quote()}});servers.push(server)
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url=`http://127.0.0.1:${server.address().port}`
  check(`${mode}: cross-origin preflight rejected`,(await fetch(url+'/preflight',{method:'POST',headers:{Origin:'https://invalid.example','Content-Type':'application/json'},body:'{}'})).status===403)
  check(`${mode}: hostile Host rejected`,await hostileHostStatus(url)===403)
  check(`${mode}: no broadcast endpoint`,(await fetch(url+'/broadcast',{method:'POST',headers:{Origin:url}})).status===404)
  check(`${mode}: unknown filesystem route rejected`,(await fetch(url+'/../../.env')).status===404)
  check(`${mode}: no preflight triggered by rejected request`,reads===0)
  const context=await browser.newContext({viewport:{width:1100,height:1000},serviceWorkers:'block'}),wallet=[],errors=[]
  await context.route('**/*',route=>new URL(route.request().url()).origin===url?route.continue():route.abort())
  await context.exposeBinding('__wallet',async(_,r)=>{
   wallet.push(r)
   if(r.method==='eth_requestAccounts'||r.method==='eth_accounts')return[expected.sender]
   if(r.method==='eth_chainId')return mode==='wrong-chain'?'0x1':'0x8f'
   if(r.method==='eth_sendTransaction'){assert.ok(mode==='synthetic-authorized'||mode==='owner-unaudited');assert.deepEqual(r.params,[walletRequest(config.candidate)]);return{syntheticReject:true}}
   throw Error('Forbidden wallet method '+r.method)
  })
  await context.addInitScript(()=>{
   const listeners={};window.__emitWallet=(event,value)=>{for(const fn of listeners[event]??[])fn(value)};const provider={on:(name,fn)=>(listeners[name]??=[]).push(fn),removeListener:(name,fn)=>{listeners[name]=(listeners[name]??[]).filter(f=>f!==fn)},request:async r=>{const v=await window.__wallet(r);if(v?.syntheticReject)throw Object.assign(Error('Synthetic wallet rejected; no signer exists'),{code:4001});return v}}
   const announce=()=>window.dispatchEvent(new CustomEvent('eip6963:announceProvider',{detail:{info:{name:'MetaMask test fixture',rdns:'io.metamask',uuid:'11111111-1111-4111-8111-111111111111',icon:'data:image/svg+xml,<svg/>'},provider}}))
   window.addEventListener('eip6963:requestProvider',announce);announce()
  })
  const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message))
  const response=await page.goto(url);await page.getByText(expected.sourceHash,{exact:true}).waitFor()
  check(`${mode}: no wallet access or RPC on load`,wallet.length===0&&reads===0)
  check(`${mode}: loopback security headers`,response.headers()['content-security-policy'].includes("connect-src 'self'")&&response.headers()['cache-control']==='no-store')
  check(`${mode}: exact artifact/data/sender/network/fee fields visible`,await page.getByText(expected.artifactHash,{exact:true}).isVisible()&&await page.getByText(expected.creationHash,{exact:true}).isVisible()&&await page.getByText(expected.sender,{exact:true}).isVisible()&&await page.getByText('125 gwei / 2 gwei',{exact:true}).isVisible())
  check(`${mode}: wallet request disabled before steps`,await page.locator('#submit').isDisabled())
  if(mode.startsWith('owner-'))await page.locator('#review-path').selectOption('owner-unaudited')
  await page.locator('#preflight').click();await page.waitForFunction(()=>document.querySelector('#preflight-result').textContent.includes('expectedRemainingAtCapMON'))
  check(`${mode}: explicit preflight does not connect`,wallet.length===0&&reads===1)
  check(`${mode}: fresh reserve shown`,(await page.locator('#preflight-result').innerText()).includes('"expectedRemainingAtCapMON": "0.2"'))
  await page.locator('#connect').click()
  if(mode==='wrong-chain'){
   await page.getByRole('alert').filter({hasText:'Select Monad mainnet chain 143'}).waitFor()
   check('wrong-chain: cannot arm or switch automatically',await page.locator('#arm').isDisabled()&&!wallet.some(r=>r.method.startsWith('wallet_')))
  }else{
   await page.getByText(/Connected 0x320e/).waitFor()
   await page.locator('#preflight').click();await page.waitForFunction(()=>document.querySelector('#preflight-result').textContent.includes('expectedRemainingAtCapMON')&&!document.querySelector('#preflight').disabled)
   if(mode.startsWith('owner-')){
    check(`${mode}: unaudited label and separate confirmation`,await page.locator('#owner-panel').isVisible()&&!await page.locator('#independent-panel').isVisible())
    await page.locator('#digest').fill(expected.signingDigest);await page.locator('#arm').click()
    check(`${mode}: missing owner consent rejects arming`,await page.locator('#submit').isDisabled()&&!wallet.some(r=>r.method==='eth_sendTransaction'))
    for(const key of riskKeys)await page.locator('#'+key).check()
    await page.locator('#owner-phrase').fill(ownerAcceptancePhrase)
   }else await page.locator('#independent').check()
   await page.locator('#digest').fill(expected.signingDigest)
   if(mode==='locked'){
    check('locked: current file prevents arming despite typed confirmation',await page.locator('#arm').isDisabled())
    await page.evaluate(()=>{document.querySelector('#arm').disabled=false;document.querySelector('#arm').click();document.querySelector('#submit').disabled=false;document.querySelector('#submit').click()})
    check('locked: forced DOM clicks still cannot request deployment',!wallet.some(r=>r.method==='eth_sendTransaction'))
   }else{
    check('synthetic: typing confirmation alone never requests write',!wallet.some(r=>r.method==='eth_sendTransaction')&&await page.locator('#submit').isDisabled())
    await page.locator('#arm').click();check('synthetic: independent step never requests write',!wallet.some(r=>r.method==='eth_sendTransaction'))
    if(mode==='owner-account-change'||mode==='owner-chain-change'){
     await page.evaluate(mode=>window.__emitWallet(mode==='owner-account-change'?'accountsChanged':'chainChanged',mode==='owner-account-change'?['0x1111111111111111111111111111111111111111']:'0x1'),mode)
     check(`${mode}: context event invalidates acceptance`,await page.locator('#submit').isDisabled()&&await page.locator('#arm').isDisabled()&&!wallet.some(r=>r.method==='eth_sendTransaction'))
     check(`${mode}: no uncaught browser errors`,errors.length===0);await context.close();continue
    }
    await page.locator('#submit').click();await page.getByRole('alert').filter({hasText:'Synthetic wallet rejected'}).waitFor()
    check('synthetic: final click requests exact creation once',wallet.filter(r=>r.method==='eth_sendTransaction').length===1)
    await page.reload();await page.getByText(expected.sourceHash,{exact:true}).waitFor()
    check('synthetic: persistent attempt blocks retry after reload',await page.locator('#submit').isDisabled()&&(await page.locator('#attempt').innerText()).includes('REQUEST_STARTED_CHECK_METAMASK')&&wallet.filter(r=>r.method==='eth_sendTransaction').length===1)
   }
  }
  check(`${mode}: no uncaught browser errors`,errors.length===0)
  await context.close()
 }
 console.log(JSON.stringify({checks:checks.length,names:checks,syntheticOnly:true,externalBrowserRequestsBlocked:true,realWalletUsed:false,authorizationFileModified:false},null,2))
}finally{await browser?.close();for(const server of servers)await new Promise(resolve=>server.close(resolve))}
