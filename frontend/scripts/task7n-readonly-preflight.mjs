// Read-only RPC compatibility probe. Public address observation is not wallet control or consent.
import {createPublicClient, http, keccak256, parseAbi, formatEther} from 'viem'
import {approvedArtifact,collection} from './release-artifact.mjs'
const build=await approvedArtifact(),game='0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390',tokenId=1425n,calls=[]
const permitted=new Set(['eth_chainId','eth_getBlockByNumber','eth_getCode','eth_call','eth_estimateGas','eth_getBalance','eth_getTransactionCount','eth_maxPriorityFeePerGas','eth_gasPrice'])
const client=createPublicClient({transport:http('https://rpc.monad.xyz',{retryCount:0,timeout:15000,onFetchRequest:async request=>{const {method}=await request.clone().json();if(!permitted.has(method))throw Error('Forbidden RPC method '+method);calls.push(method)}})})
const steps={};async function step(name,fn){try{steps[name]={status:'PASS',...await fn()}}catch(error){steps[name]={status:'UNAVAILABLE',message:error.shortMessage??error.message}}}
let owner
await step('deployment',async()=>{const chain=await client.getChainId(),block=await client.getBlock({blockTag:'finalized'}),code=await client.getCode({address:game,blockNumber:block.number}),binding=await client.readContract({address:game,abi:build.artifact.abi,functionName:'CHOG_GENESIS',blockNumber:block.number});if(chain!==143||keccak256(code)!==build.runtimeCodeHash||binding.toLowerCase()!==collection.toLowerCase())throw Error('Deployment mismatch');return{chain,block:block.number,runtimeHash:keccak256(code),binding}})
await step('owner',async()=>{owner=await client.readContract({address:collection,abi:parseAbi(['function ownerOf(uint256) view returns(address)']),functionName:'ownerOf',args:[tokenId]});return{publicToken:tokenId,ownerObserved:true,walletControlProven:false}})
if(owner){
 const request={address:game,abi:build.artifact.abi,functionName:'act',args:[tokenId,1],account:owner}
 await step('simulation',async()=>{const simulated=await client.simulateContract(request);return{canAct:simulated.result.canAct,day:simulated.result.day,eventId:simulated.result.eventId,choiceId:simulated.result.choiceId}})
 await step('gasEstimate',async()=>({gas:await client.estimateContractGas(request)}))
 await step('feeEstimate',async()=>{const fees=await client.estimateFeesPerGas();return{maxFeePerGas:fees.maxFeePerGas,maxPriorityFeePerGas:fees.maxPriorityFeePerGas}})
 await step('balanceAndNonce',async()=>({observedBalanceMON:formatEther(await client.getBalance({address:owner})),latestNonce:await client.getTransactionCount({address:owner,blockTag:'latest'}),pendingNonce:await client.getTransactionCount({address:owner,blockTag:'pending'})}))
}
console.log(JSON.stringify({checkedAt:new Date().toISOString(),publicAddressObserverOnly:true,signatureOrBroadcast:false,methods:calls,steps},(_,value)=>typeof value==='bigint'?value.toString():value,2))
