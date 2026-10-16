import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {createRequire} from 'node:module'
import {expected,collectionRuntimeHash,validateCandidate,walletRequest,authorizationError,validatePreflight,submitReviewed,riskKeys,ownerAcceptancePhrase,ownerDecisionError} from './model.mjs'
const require=createRequire(new URL('../../frontend/package.json',import.meta.url)),crypto=require('viem')
const candidate=JSON.parse(await fs.readFile(new URL('../../docs/evidence/task6e/unsigned-deployment-candidate.json',import.meta.url)))
const now=1792167000000
const approval=()=>({status:'AUTHORIZED_ONE_ATTEMPT',candidateSHA256:expected.candidateSHA256,signingPayloadKeccak256:expected.signingDigest,expiresAt:new Date(now+60000).toISOString(),references:{independentSecurity:'TEST FIXTURE ONLY',governanceCustody:'TEST FIXTURE ONLY',warningPolicy:'TEST FIXTURE ONLY',transactionApproval:'TEST FIXTURE ONLY'}})
const quote=()=>({sourceSHA256:expected.sourceHash,artifactSHA256:expected.artifactHash,creationHash:expected.creationHash,nftBinding:expected.collection,bothCreationSimulationsMatch:true,chainId:143,checkedAt:now,independentMatches:true,latestNonce:'0',pendingNonce:'0',senderCode:'0x',expectedAddressCode:'0x',collectionRuntimeHash,creationRuntimeHash:expected.runtimeHash,balanceWei:'400000000000000000',estimateGas:'1510761',baseFeePerGas:'100000000000'})
function context(overrides={}){const calls=[];let marker=false;const args={provider:{request:async r=>{calls.push(r);if(r.method==='eth_accounts')return[expected.sender];if(r.method==='eth_chainId')return'0x8f';if(r.method==='eth_sendTransaction'){assert.equal(marker,true);throw Object.assign(Error('Synthetic user rejection'),{code:4001})}throw Error('Forbidden fixture method')}},candidate,crypto,authorization:approval(),reviewed:quote(),independentConfirmed:true,typedDigest:expected.signingDigest,isCurrent:()=>true,getFresh:async()=>quote(),alreadyAttempted:()=>marker,recordAttempt:()=>{marker=true},now:()=>now,...overrides};return{args,calls}}
test('pins exact artifact, construction data and unsigned payload; rejects altered transaction fields',()=>{
 assert.equal(validateCandidate(candidate,crypto),candidate)
 for(const change of [{nonce:1},{chainId:1},{from:'0x1111111111111111111111111111111111111111'},{gas:'1600001'},{maxFeePerGas:'126000000000'},{value:'1'},{to:expected.collection},{data:candidate.data+'00'},{sourceHash:'x'},{unsignedSerialized:'0x02'},{accessList:[{}]}])assert.throws(()=>validateCandidate({...candidate,...change},crypto))
})
test('EIP-1193 creation request reconstructs the exact signing payload and fees',()=>{
 const r=walletRequest(candidate);assert.equal('to'in r,false);assert.equal(r.chainId,'0x8f');assert.equal(r.nonce,'0x0')
 const serialized=crypto.serializeTransaction({type:'eip1559',chainId:Number(BigInt(r.chainId)),nonce:Number(BigInt(r.nonce)),gas:BigInt(r.gas),maxFeePerGas:BigInt(r.maxFeePerGas),maxPriorityFeePerGas:BigInt(r.maxPriorityFeePerGas),value:BigInt(r.value),data:r.data,accessList:r.accessList})
 assert.equal(serialized,candidate.unsignedSerialized);assert.equal(crypto.keccak256(serialized),expected.signingDigest)
})
test('authorization defaults closed, binds exact digest/references and expires',()=>{
 assert.ok(authorizationError(null,now));assert.ok(authorizationError({...approval(),status:'NOT_AUTHORIZED'},now));assert.equal(authorizationError(approval(),now),null)
 for(const change of [{candidateSHA256:'bad'},{signingPayloadKeccak256:'bad'},{expiresAt:new Date(now).toISOString()},{references:{}}])assert.ok(authorizationError({...approval(),...change},now))
})
test('read-only preflight rejects wrong network/nonces/code/runtime/balance/gas/fees/freshness',()=>{
 assert.equal(validatePreflight(quote(),now).chainId,143)
 for(const change of [{chainId:1},{independentMatches:false},{latestNonce:'1'},{pendingNonce:'1'},{senderCode:'0xef0100'},{expectedAddressCode:'0x60'},{collectionRuntimeHash:'0x'},{creationRuntimeHash:'0x'},{balanceWei:'299999999999999999'},{estimateGas:'1600001'},{estimateGas:'0'},{baseFeePerGas:'124000000000'},{checkedAt:now-60001},{checkedAt:now+1}])assert.throws(()=>validatePreflight({...quote(),...change},now))
})
test('no authorization or independent confirmation means zero wallet calls',async()=>{
 for(const change of [{authorization:null},{independentConfirmed:false},{typedDigest:'wrong'}]){const {args,calls}=context(change);await assert.rejects(()=>submitReviewed(args));assert.deepEqual(calls,[])}
})
test('wrong wallet account/chain blocks writes',async()=>{
 for(const [accounts,chain]of [[[expected.sender],'0x1'],[['0x1111111111111111111111111111111111111111'],'0x8f']]){const calls=[];const {args}=context({provider:{request:async r=>{calls.push(r);return r.method==='eth_accounts'?accounts:chain}}});await assert.rejects(()=>submitReviewed(args));assert.equal(calls.some(r=>r.method==='eth_sendTransaction'),false)}
})
test('fresh failures, changed quote or async wallet context prevent a write',async()=>{
 for(const change of [{getFresh:async()=>{throw Error('RPC unavailable')}},{getFresh:async()=>({...quote(),balanceWei:'350000000000000000'})},{isCurrent:()=>false}]){const{args,calls}=context(change);await assert.rejects(()=>submitReviewed(args));assert.equal(calls.some(r=>r.method==='eth_sendTransaction'),false)}
})
test('only explicit fully checked call can reach synthetic wallet; persisted marker blocks retry',async()=>{
 const{args,calls}=context();await assert.rejects(()=>submitReviewed(args),/Synthetic user rejection/)
 assert.equal(calls.filter(r=>r.method==='eth_sendTransaction').length,1)
 assert.deepEqual(calls.at(-1).params,[walletRequest(candidate)])
 await assert.rejects(()=>submitReviewed(args),/attempt is already recorded/);assert.equal(calls.filter(r=>r.method==='eth_sendTransaction').length,1)
})
test('storage failure and late authorization expiry prevent wallet write',async()=>{
 const{args,calls}=context({recordAttempt:()=>{throw Error('Storage unavailable')}});await assert.rejects(()=>submitReviewed(args),/Storage unavailable/);assert.equal(calls.some(r=>r.method==='eth_sendTransaction'),false)
 let tick=0;const later=context({now:()=>++tick>3?now+60001:now});await assert.rejects(()=>submitReviewed(later.args));assert.equal(later.calls.some(r=>r.method==='eth_sendTransaction'),false)
})

test('authorization revocation during preflight blocks the final wallet request',async()=>{const{args,calls}=context({getAuthorization:async()=>null});await assert.rejects(()=>submitReviewed(args),/NOT AUTHORIZED/);assert.equal(calls.some(r=>r.method==='eth_sendTransaction'),false)})

const ownerDecision=JSON.parse(await fs.readFile(new URL('./owner-risk-acceptance.json',import.meta.url)))
const ownerConfirmation=()=>({...Object.fromEntries(riskKeys.map(key=>[key,true])),phrase:ownerAcceptancePhrase})
function ownerContext(overrides={}){return context({reviewPath:'owner-unaudited',authorization:null,independentConfirmed:false,ownerDecision,ownerConfirmation:ownerConfirmation(),...overrides})}
test('owner path is separate from genuine independent acceptance and binds exact candidate',async()=>{
 assert.ok(authorizationError(ownerDecision,now));assert.equal(ownerDecisionError(ownerDecision),null)
 for(const change of [{ownerDecision:null},{ownerDecision:{...ownerDecision,independentAudit:true}},{ownerDecision:{...ownerDecision,candidateSHA256:'bad'}},{reviewPath:'fake-review'},{reviewPath:'independent'},{typedDigest:'bad'},{ownerConfirmation:{...ownerConfirmation(),phrase:'yes'}}]){const{args,calls}=ownerContext(change);await assert.rejects(()=>submitReviewed(args));assert.equal(calls.length,0)}
 for(const key of riskKeys){const{args,calls}=ownerContext({ownerConfirmation:{...ownerConfirmation(),[key]:false}});await assert.rejects(()=>submitReviewed(args));assert.equal(calls.length,0)}
})
test('owner rejection never retries and does not require or invent independent acceptance',async()=>{
 const{args,calls}=ownerContext();await assert.rejects(()=>submitReviewed(args),/Synthetic user rejection/);assert.equal(calls.filter(r=>r.method==='eth_sendTransaction').length,1);await assert.rejects(()=>submitReviewed(args),/attempt is already recorded/)
})
test('owner path rejects stale nonce, RPC disagreement, both simulation failures, artifacts and spending violations',async()=>{
 for(const change of [{latestNonce:'1'},{pendingNonce:'1'},{independentMatches:false},{bothCreationSimulationsMatch:false},{artifactSHA256:'bad'},{sourceSHA256:'bad'},{creationHash:'bad'},{nftBinding:'bad'},{creationRuntimeHash:'bad'},{collectionRuntimeHash:'bad'},{balanceWei:'299999999999999999'},{estimateGas:'1600001'},{baseFeePerGas:'124000000000'},{checkedAt:now-60001}]){
 const{args,calls}=ownerContext({getFresh:async()=>({...quote(),...change})});await assert.rejects(()=>submitReviewed(args));assert.equal(calls.some(r=>r.method==='eth_sendTransaction'),false)
 }
 for(const change of [{gas:'1600001'},{maxFeePerGas:'126000000000'},{value:'1'}]){const{args,calls}=ownerContext({candidate:{...candidate,...change}});await assert.rejects(()=>submitReviewed(args));assert.equal(calls.length,0)}
})
test('owner account/chain changes between checks and owner decision revocation prevent any request',async()=>{
 for(const what of ['account','chain','context','revoked']){
 let fresh=false;const calls=[];const{args}=ownerContext({getFresh:async()=>{fresh=true;return quote()},isCurrent:()=>what!=='context'||!fresh,getOwnerDecision:async()=>what==='revoked'?null:ownerDecision,provider:{request:async r=>{calls.push(r);if(r.method==='eth_accounts')return[fresh&&what==='account'?'0x1111111111111111111111111111111111111111':expected.sender];if(r.method==='eth_chainId')return fresh&&what==='chain'?'0x1':'0x8f';throw Error('Unexpected write')}}});await assert.rejects(()=>submitReviewed(args));assert.equal(calls.some(r=>r.method==='eth_sendTransaction'),false)
 }
})

test('missing final owner record cannot fall back to earlier acceptance',async()=>{const{args,calls}=ownerContext({getOwnerDecision:async()=>undefined});await assert.rejects(()=>submitReviewed(args));assert.equal(calls.some(r=>r.method==='eth_sendTransaction'),false)})
