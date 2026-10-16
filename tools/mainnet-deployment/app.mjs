import {keccak256,serializeTransaction,formatEther} from 'viem'
import {expected,validateCandidate,authorizationError,validatePreflight,assertWallet,submitReviewed,ownerDecisionError,confirmationError,riskKeys} from './model.mjs'
const $=id=>document.getElementById(id),crypto={keccak256,serializeTransaction}
let config,provider,connected=false,reviewed,armed=false,busy=false,epoch=0
const providers=new Map(),attemptKey='chog-deployment-attempt:'+expected.signingDigest
function path(){return $('review-path').value}
function ownerConfirmation(){return Object.fromEntries([...riskKeys.map(key=>[key,$(key).checked]),['phrase',$('owner-phrase').value]])}
function invalidate(){epoch++;connected=false;reviewed=undefined;armed=false;$('independent').checked=false;for(const key of riskKeys)$(key).checked=false;$('owner-phrase').value='';$('digest').value='';$('wallet-status').textContent='Wallet context changed. Reconnect, preflight and independently review again.';render()}
function recorded(){try{return JSON.parse(localStorage.getItem(attemptKey)||'null')}catch{throw Error('Attempt storage unreadable; fail closed')}}
function error(e){$('error').textContent=e.message??String(e)}
function render(){
 const gate=config?(path()==='independent'?authorizationError(config.authorization):ownerDecisionError(config.ownerDecision)):'Loading';const locked=Boolean(gate)
 $('independent-panel').hidden=path()!=='independent';$('owner-panel').hidden=path()!=='owner-unaudited'
 $('arm').textContent=path()==='independent'?'Complete independent confirmation':'Confirm owner acceptance of unaudited risk'
 $('authorization').textContent=gate??(path()==='owner-unaudited'?'UNAUDITED owner preparation path. No audit or provider clearance. Final transaction consent has not been given.':'Independent authorization references present; verify genuine documents. This tool cannot authenticate a reviewer.')
 $('connect').disabled=busy||!$('wallets').value
 $('preflight').disabled=busy||!config
 $('arm').disabled=busy||locked||!connected||!reviewed
 $('submit').disabled=busy||locked||!connected||!armed||!reviewed||Boolean(recorded())
 const attempt=recorded();$('attempt').textContent=attempt?JSON.stringify(attempt,null,2)+' — no automatic retry. Check MetaMask, receipt and nonce before any further action.':'No attempt recorded.'
}
function addProvider({info,provider:wallet}){
 if(info?.rdns!=='io.metamask'||!info.uuid||!wallet?.request||providers.has(info.uuid))return
 providers.set(info.uuid,{info,provider:wallet});const option=document.createElement('option');option.value=info.uuid;option.textContent=`${info.name} (${info.rdns})`;if($('wallets').options[0]?.value==='')$('wallets').replaceChildren();$('wallets').append(option);render()
}
window.addEventListener('eip6963:announceProvider',event=>addProvider(event.detail??{}))
window.dispatchEvent(new Event('eip6963:requestProvider'))
// Legacy fallback is explicit and labeled; it is never selected over discovered providers.
if(!providers.size&&window.ethereum?.isMetaMask)addProvider({info:{rdns:'io.metamask',name:'MetaMask — legacy provider, verify extension',uuid:'legacy'},provider:window.ethereum})
$('wallets').addEventListener('change',invalidate)
$('review-path').addEventListener('change',invalidate)
$('connect').addEventListener('click',async()=>{
 if(busy)return;busy=true;armed=false;reviewed=undefined;connected=false;epoch++;const run=epoch;render()
 try{
  if(provider){for(const event of ['accountsChanged','chainChanged','disconnect'])provider.removeListener?.(event,invalidate)}
  provider=providers.get($('wallets').value)?.provider;if(!provider)throw Error('Select the genuine MetaMask provider')
  for(const event of ['accountsChanged','chainChanged','disconnect'])provider.on?.(event,invalidate)
  const accounts=await provider.request({method:'eth_requestAccounts'}),chain=await provider.request({method:'eth_chainId'})
  assertWallet(accounts,chain);if(run!==epoch)throw Error('Wallet changed during connection; reconnect to verify')
  connected=true;$('wallet-status').textContent=`Connected ${accounts[0]} · chain 143. No signature requested.`
 }catch(e){error(e)}finally{busy=false;render()}
})
async function preflight(){const response=await fetch('/preflight',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});const result=await response.json();if(!response.ok)throw Error(result.error??'Preflight failed');return validatePreflight(result)}
$('preflight').addEventListener('click',async()=>{
 if(busy)return;busy=true;armed=false;reviewed=undefined;const run=epoch;render()
 try{const result=await preflight();if(run!==epoch)throw Error('Context changed during preflight');reviewed=result;$('preflight-result').textContent=JSON.stringify({...result,maximumCostMON:'0.2',minimumReserveMON:'0.1',balanceMON:formatEther(BigInt(result.balanceWei)),expectedRemainingAtCapMON:formatEther(BigInt(result.balanceWei)-200000000000000000n)},null,2)}catch(e){error(e)}finally{busy=false;render()}
})
for(const id of ['digest','independent','owner-phrase',...riskKeys])$(id).addEventListener('input',()=>{epoch++;armed=false;render()})
$('arm').addEventListener('click',()=>{try{const failure=confirmationError({reviewPath:path(),authorization:config.authorization,ownerDecision:config.ownerDecision,ownerConfirmation:ownerConfirmation(),independentConfirmed:$('independent').checked,typedDigest:$('digest').value});if(failure)throw Error(failure);if(!connected)throw Error('Connect the exact deployer');validatePreflight(reviewed);armed=true;$('error').textContent=path()==='owner-unaudited'?'Owner unaudited acceptance recorded locally. No independent audit claimed. Wallet request remains a separate action.':'Independent confirmation recorded locally; wallet request remains separate.';render()}catch(e){error(e)}})
$('submit').addEventListener('click',async()=>{
 if(busy||!armed)return;busy=true;const run=epoch;render()
 try{
  // Re-read the local authorization record and fresh chain state before the only wallet write.
  const current=await(await fetch('/config')).json()
  const hash=await submitReviewed({provider,candidate:config.candidate,crypto,authorization:current.authorization,reviewPath:path(),ownerDecision:current.ownerDecision,ownerConfirmation:ownerConfirmation(),getOwnerDecision:async()=>{const response=await fetch('/config');if(!response.ok)throw Error('Owner decision reload failed');return(await response.json()).ownerDecision},reviewed,independentConfirmed:$('independent').checked,typedDigest:$('digest').value,isCurrent:()=>epoch===run&&connected,getFresh:preflight,getAuthorization:async()=>{const response=await fetch('/config');if(!response.ok)throw Error('Authorization reload failed');return(await response.json()).authorization},alreadyAttempted:()=>Boolean(recorded()),recordAttempt:()=>localStorage.setItem(attemptKey,JSON.stringify({reviewPath:path(),ownerConfirmation:path()==='owner-unaudited'?ownerConfirmation():null,state:'REQUEST_STARTED_CHECK_METAMASK',at:new Date().toISOString(),digest:expected.signingDigest}))})
  localStorage.setItem(attemptKey,JSON.stringify({state:'SUBMITTED_VERIFY_BEFORE_ANY_RETRY',hash,at:new Date().toISOString(),digest:expected.signingDigest}))
 }catch(e){error(e)}finally{busy=false;armed=false;reviewed=undefined;render()}
})
$('export').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({candidateSHA256:expected.candidateSHA256,signingPayloadDigest:expected.signingDigest,reviewPath:path(),ownerDecision:config?.ownerDecision,ownerConfirmation:path()==='owner-unaudited'?ownerConfirmation():null,authorization:config?.authorization,preflight:reviewed,attempt:recorded()},null,2)],{type:'application/json'});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='chog-local-deployment-review.json';link.click();URL.revokeObjectURL(link.href)})
try{
 config=await(await fetch('/config')).json();validateCandidate(config.candidate,crypto)
 const lines={'Deployer':expected.sender,'Network':'Monad mainnet · chain 143 (0x8f)','Source SHA-256':expected.sourceHash,'Artifact SHA-256':expected.artifactHash,'Candidate JSON SHA-256':expected.candidateSHA256,'Creation data Keccak-256':expected.creationHash,'Unsigned signing-payload digest':expected.signingDigest,'Constructor binding':expected.collection+' · no arguments','Expected game runtime':expected.runtimeHash,'To / value / nonce':'Contract creation (no to) · 0 MON · nonce 0','Gas limit':'1,600,000','Maximum fee / priority':'125 gwei / 2 gwei','Maximum cost / minimum reserve':'0.2 MON / 0.1 MON','Expected remaining balance':'Run fresh read-only preflight before review; no reserve assertion from old evidence','Expected CREATE address':expected.createAddress+' · prediction only'}
 for(const [name,value]of Object.entries(lines)){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=name;dd.textContent=value;$('details').append(dt,dd)}
 $('request').textContent=JSON.stringify(config.request,null,2);render()
}catch(e){config=undefined;error(e);render()}
// Expiry never silently leaves an armed request enabled.
setInterval(()=>{if(reviewed&&Date.now()-reviewed.checkedAt>60000){reviewed=undefined;armed=false;$('preflight-result').textContent='Preflight expired. Refresh and independently review again.'}render()},1000)
