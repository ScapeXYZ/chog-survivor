// Read-only, wallet-free review for an explicitly selected genuine NFT token.
// Does not connect to Chrome, request accounts, sign, send or persist transactions.
import assert from 'node:assert/strict'
import {createPublicClient, http, parseAbi, keccak256, encodeFunctionData, formatEther} from 'viem'
import {approvedArtifact, collection} from './release-artifact.mjs'
const index=process.argv.indexOf('--token-id'),input=index<0?undefined:process.argv[index+1]
assert.ok(input&&/^\d+$/.test(input),'Usage: node frontend/scripts/task7p-wallet-readonly.mjs --token-id <genuine-token-id>')
const tokenId=BigInt(input);assert.ok(tokenId<2n**256n,'Token ID must fit uint256')
const build=await approvedArtifact(),game='0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390'
const permitted=new Set(['eth_chainId','eth_getBlockByNumber','eth_getCode','eth_call','eth_estimateGas','eth_getBalance','eth_getTransactionCount','eth_maxPriorityFeePerGas','eth_gasPrice']),methods=[]
const client=createPublicClient({transport:http('https://rpc.monad.xyz',{retryCount:0,timeout:15000,onFetchRequest:async request=>{const payload=await request.clone().json();assert.ok(permitted.has(payload.method),'Forbidden RPC method');methods.push(payload.method)}})})
const chain=await client.getChainId(),block=await client.getBlock({blockTag:'latest'})
assert.equal(chain,143);assert.ok(block.number!==null&&block.hash)
const nftAbi=parseAbi(['function ownerOf(uint256) view returns(address)'])
const [code,nftCode,binding,owner,state,title,fees]=await Promise.all([
 client.getCode({address:game,blockNumber:block.number}),client.getCode({address:collection,blockNumber:block.number}),
 client.readContract({address:game,abi:build.artifact.abi,functionName:'CHOG_GENESIS',blockNumber:block.number}),
 client.readContract({address:collection,abi:nftAbi,functionName:'ownerOf',args:[tokenId],blockNumber:block.number}),
 client.readContract({address:game,abi:build.artifact.abi,functionName:'characterOf',args:[tokenId],blockNumber:block.number}),
 client.readContract({address:game,abi:build.artifact.abi,functionName:'titleOf',args:[tokenId],blockNumber:block.number}),client.estimateFeesPerGas(),
])
assert.equal(keccak256(code),build.runtimeCodeHash)
assert.equal(keccak256(nftCode),'0x91aa1fd28371674abeb31670fd694cacaca57ac29cae579452c5150eb5dbab46')
assert.equal(binding.toLowerCase(),collection.toLowerCase())
const [balance,latestNonce,pendingNonce]=await Promise.all([client.getBalance({address:owner,blockNumber:block.number}),client.getTransactionCount({address:owner,blockTag:'latest'}),client.getTransactionCount({address:owner,blockTag:'pending'})])
const policy={gas:400000n,maxFee:125000000000n,maxCost:50000000000000000n,reserve:100000000000000000n},choices=[]
for(const choiceId of [1,2,3]){
 const request={address:game,abi:build.artifact.abi,functionName:'act',args:[tokenId,choiceId],account:owner},data=encodeFunctionData(request)
 const unsigned={chainId:143,to:game,function:'act',args:[tokenId,choiceId],data,dataHash:keccak256(data),value:'0 MON',nonce:pendingNonce}
 try{
  const preview=await client.readContract({...request,functionName:'preview',blockNumber:block.number})
  if(!preview.canAct){choices.push({choiceId,status:'DAILY_ACTION_UNAVAILABLE',unsigned,preview});continue}
  const simulated=await client.simulateContract({...request,blockNumber:block.number}),estimate=await client.estimateContractGas(request),gas=(estimate*125n+99n)/100n
  assert.equal(typeof fees.maxFeePerGas,'bigint');assert.equal(typeof fees.maxPriorityFeePerGas,'bigint')
  const cost=gas*fees.maxFeePerGas
  const suitable=estimate>0n&&gas<=policy.gas&&fees.maxFeePerGas>0n&&fees.maxFeePerGas<=policy.maxFee&&fees.maxPriorityFeePerGas>=0n&&fees.maxPriorityFeePerGas<=fees.maxFeePerGas&&cost<=policy.maxCost&&balance>=cost+policy.reserve&&latestNonce===pendingNonce&&86400n-block.timestamp%86400n>120n
  choices.push({choiceId,status:'READ_ONLY_SIMULATION_PASS',unsigned:{...unsigned,gas,maxFeePerGas:fees.maxFeePerGas,maxPriorityFeePerGas:fees.maxPriorityFeePerGas},estimatedGas:estimate,maximumCostMON:formatEther(cost),minimumBalanceMON:formatEther(cost+policy.reserve),reserveAfterMaximumCostMON:formatEther(balance-cost),withinProvisionalLimits:suitable,projection:simulated.result,projectionIsNotConfirmedState:true})
 }catch(error){choices.push({choiceId,status:'UNAVAILABLE',unsigned,message:error.shortMessage??error.message})}
}
assert.equal((await client.getBlock({blockNumber:block.number})).hash,block.hash,'RPC canonical block changed')
console.log(JSON.stringify({checkedAt:new Date().toISOString(),chainId:143,block:block.number,tokenId,game,collection,runtimeHash:keccak256(code),collectionRuntimeHash:keccak256(nftCode),sourceHash:build.sourceHash,ownerOfVerified:true,ownerAddressNotRecorded:true,connectedWalletOwnershipVerified:false,installedWalletUsed:false,signingOrBroadcast:false,actualRecordedState:state,actualTitleId:title,latestNonce,pendingNonce,choices,methods,provisionalPolicy:{gasLimit:policy.gas,maxFeePerGas:policy.maxFee,maximumCostMON:'0.05',minimumReserveMON:'0.1'},note:'Public RPC observation only. Compare owner with the selected wallet locally; this output does not prove account control or holder consent. Quotes are not reusable authorizations.'},(_,v)=>typeof v==='bigint'?v.toString():v,2))
