// Shared fail-closed policy. This module never calls a wallet or network.
export const expected = Object.freeze({
  sender: '0x320eDAe253259053d53feD8eEe6D9C0274A91E85', chainId: 143, nonce: 0,
  gas: '1600000', maxFeePerGas: '125000000000', maxPriorityFeePerGas: '2000000000',
  minimumReserve: '100000000000000000', maximumCost: '200000000000000000',
  candidateSHA256: 'f7707ac8ae138a75b1b26777684f6235f91edf17c2980a1c585f39c3cce2643a',
  sourceHash: '5a996b04ee91f99c9da5bbe04ccaed69b2d0f887d3fef640be10e205123638c7',
  artifactHash: 'adf4c5c23213818fdcafb7ea55ca3e50a277156bccf7abe4a90a83cc8d0545f0',
  creationHash: '0x683228f50a7350cedddb7c6f8df777d05cec0756c725ace1e4b8a50d84adab29',
  runtimeHash: '0x1d4eef400bc1459016dff9de08fa360deeb148a34be40053e3d260aa2047a475',
  signingDigest: '0xd1a256ad5ca962d06e9cb55243436faec4b58e77fd61b21309b6fc88012389e9',
  collection: '0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763',
  createAddress: '0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390',
})
// Full constant kept literal for review; no address or fee may come from user form input.
export const collectionRuntimeHash = '0x91aa1fd28371674abeb31670fd694cacaca57ac29cae579452c5150eb5dbab46'
export function requireThat(value, message) { if (!value) throw Error(message) }
export function validateCandidate(c, crypto) {
  for (const [key, value] of Object.entries({from:expected.sender,chainId:143,nonce:0,type:'eip1559',gas:expected.gas,maxFeePerGas:expected.maxFeePerGas,maxPriorityFeePerGas:expected.maxPriorityFeePerGas,value:'0',to:null,sourceHash:expected.sourceHash,creationHash:expected.creationHash,expectedRuntimeHash:expected.runtimeHash,gameArtifactFileSHA256:expected.artifactHash,signingPayloadKeccak256:expected.signingDigest,expectedCreateAddress:expected.createAddress,signature:null,transactionHash:null,authorization:null})) requireThat(c[key] === value, `Candidate mismatch: ${key}`)
  requireThat(Array.isArray(c.accessList)&&c.accessList.length===0&&Array.isArray(c.constructorArguments)&&c.constructorArguments.length===0,'Unexpected access list/constructor')
  requireThat(/^0x[0-9a-f]+$/i.test(c.data)&&(c.data.length-2)/2===6772,'Invalid creation data')
  requireThat(crypto.keccak256(c.data)===expected.creationHash,'Creation data hash mismatch')
  const serialized=crypto.serializeTransaction({type:'eip1559',chainId:143,nonce:0,gas:1600000n,maxFeePerGas:125000000000n,maxPriorityFeePerGas:2000000000n,value:0n,data:c.data,accessList:[]})
  requireThat(serialized===c.unsignedSerialized&&crypto.keccak256(serialized)===expected.signingDigest,'Unsigned payload mismatch')
  return c
}
export function walletRequest(c) {
  // No `to` property: this is direct contract creation, not a call to the NFT/address prediction.
  return {from:expected.sender,chainId:'0x8f',type:'0x2',nonce:'0x0',value:'0x0',gas:'0x186a00',maxFeePerGas:'0x1d1a94a200',maxPriorityFeePerGas:'0x77359400',accessList:[],data:c.data}
}
export function authorizationError(a, now=Date.now()) {
  if (!a || a.status!=='AUTHORIZED_ONE_ATTEMPT') return 'NOT AUTHORIZED: independent security, governance/custody, warning-policy and explicit transaction approvals remain required.'
  if (a.candidateSHA256!==expected.candidateSHA256 || a.signingPayloadKeccak256!==expected.signingDigest) return 'Authorization does not bind this exact candidate.'
  if (!Number.isFinite(Date.parse(a.expiresAt)) || Date.parse(a.expiresAt)<=now) return 'Authorization is expired or has no expiry.'
  for(const field of ['independentSecurity','governanceCustody','warningPolicy','transactionApproval']) if(typeof a.references?.[field]!=='string'||!a.references[field].trim()) return `Missing approval reference: ${field}`
  return null
}
export const riskKeys = Object.freeze(['noAudit','governanceUnknown','noProviderClearance','immutable','exactTransaction','spendingLimits'])
export const ownerAcceptancePhrase = 'I ACCEPT UNAUDITED MAINNET DEPLOYMENT RISK'
export function ownerDecisionError(a) {
  if(a?.status!=='OWNER_ACCEPTED_UNAUDITED_PREPARATION')return 'Owner unaudited decision missing; this is not independent acceptance.'
  if(a.candidateSHA256!==expected.candidateSHA256||a.signingPayloadKeccak256!==expected.signingDigest||a.sender!==expected.sender)return 'Owner decision candidate mismatch'
  if(a.independentAudit!==false)return 'Owner path must explicitly record absence of independent audit'
  return null
}
export function confirmationError({reviewPath='independent',authorization,ownerDecision,ownerConfirmation,independentConfirmed,typedDigest},now=Date.now()) {
  if(typedDigest!==expected.signingDigest)return 'Exact signing digest confirmation required'
  if(reviewPath==='independent')return authorizationError(authorization,now)||(!independentConfirmed?'Independent confirmation required':null)
  if(reviewPath!=='owner-unaudited')return 'Unknown review path'
  return ownerDecisionError(ownerDecision)||(ownerConfirmation?.phrase!==ownerAcceptancePhrase?'Exact owner risk acceptance phrase required':null)||
    (riskKeys.some(key=>ownerConfirmation?.[key]!==true)?'Every unresolved risk, exact transaction and spending limit must be explicitly accepted':null)
}
export function validatePreflight(r, now=Date.now()) {
  requireThat(r.artifactSHA256===expected.artifactHash&&r.sourceSHA256===expected.sourceHash&&r.creationHash===expected.creationHash&&r.nftBinding===expected.collection&&r.bothCreationSimulationsMatch===true,'Fresh artifact/binding or dual simulation verification failed')
  requireThat(r.chainId===143&&r.independentMatches===true,'Independent chain/RPC verification failed')
  requireThat(r.latestNonce==='0'&&r.pendingNonce==='0','Nonce changed. Stop; do not regenerate automatically.')
  requireThat(r.senderCode==='0x'&&r.expectedAddressCode==='0x','Sender delegation or expected address code changed')
  requireThat(r.collectionRuntimeHash===collectionRuntimeHash&&r.creationRuntimeHash===expected.runtimeHash,'Runtime/binding artifact mismatch')
  requireThat(BigInt(r.balanceWei)>=BigInt(expected.maximumCost)+BigInt(expected.minimumReserve),'Insufficient balance/reserve')
  requireThat(BigInt(r.estimateGas)>0n&&BigInt(r.estimateGas)<=1600000n,'Creation estimate exceeds reviewed limit')
  requireThat(BigInt(r.baseFeePerGas)+2000000000n<=125000000000n,'Base fee plus priority exceeds cap')
  requireThat(Number.isFinite(r.checkedAt)&&now>=r.checkedAt&&now-r.checkedAt<=60000,'Preflight is stale; refresh and review again')
  return r
}
export function assertWallet(accounts, chain) {
  requireThat(chain==='0x8f','Select Monad mainnet chain 143 manually in MetaMask')
  requireThat(accounts.length===1&&accounts[0].toLowerCase()===expected.sender.toLowerCase(),'MetaMask selected account must be the exact deployer')
}
export async function submitReviewed({provider,candidate,crypto,authorization,reviewed,independentConfirmed,typedDigest,isCurrent,getFresh,recordAttempt,alreadyAttempted,getAuthorization,reviewPath='independent',ownerDecision,ownerConfirmation,getOwnerDecision,now=()=>Date.now()}) {
  validateCandidate(candidate,crypto)
  const check=(a,o)=>{const failure=confirmationError({reviewPath,authorization:a,ownerDecision:o,ownerConfirmation,independentConfirmed,typedDigest},now());requireThat(!failure,failure)}
  check(authorization,ownerDecision)
  requireThat(!alreadyAttempted(),'An attempt is already recorded. Check MetaMask and nonce; no automatic retry.')
  validatePreflight(reviewed,now())
  assertWallet(await provider.request({method:'eth_accounts'}),await provider.request({method:'eth_chainId'}))
  const fresh=validatePreflight(await getFresh(),now())
  for(const field of ['balanceWei','estimateGas','baseFeePerGas']) requireThat(fresh[field]===reviewed[field],'Quote changed. Refresh and independently review again.')
  requireThat(isCurrent(),'Wallet or page context changed; review again')
  assertWallet(await provider.request({method:'eth_accounts'}),await provider.request({method:'eth_chainId'}))
  requireThat(isCurrent(),'Wallet context changed before request')
  check(authorization,ownerDecision)
  const finalAuthorization=reviewPath==='independent'&&getAuthorization?await getAuthorization():authorization
  const finalOwnerDecision=reviewPath==='owner-unaudited'&&getOwnerDecision?await getOwnerDecision():ownerDecision
  check(finalAuthorization,finalOwnerDecision)
  validatePreflight(fresh,now())
  requireThat(isCurrent(),'Wallet context changed during final authorization check')
  requireThat(!alreadyAttempted(),'An attempt is already recorded')
  recordAttempt() // Must persist BEFORE wallet RPC. Failure to persist fails closed.
  const hash=await provider.request({method:'eth_sendTransaction',params:[walletRequest(candidate)]})
  requireThat(/^0x[0-9a-f]{64}$/i.test(hash),'Wallet returned no usable hash; check MetaMask before any further action')
  return hash
}
