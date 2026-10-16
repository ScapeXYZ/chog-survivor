// Fixed read-only post-deployment evidence collector. No wallet or broadcast methods.
import fs from 'node:fs/promises'
import {execFile} from 'node:child_process'
import {promisify} from 'node:util'
import {createPublicClient,custom,getContractAddress,keccak256,parseAbi,serializeTransaction} from 'viem'
import {approvedArtifact,collection} from './release-artifact.mjs'
const run=promisify(execFile),dir=new URL('../../docs/evidence/task7a/',import.meta.url)
const address='0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390',hash='0xea1ed7f6978f3e4c4c8c01ec83f79f394591e73810aa0622d8b95c1177be4956',sender='0x320eDAe253259053d53feD8eEe6D9C0274A91E85'
const stringify=x=>JSON.stringify(x,(_,v)=>typeof v==='bigint'?v.toString():v,2)+'\n'
const transcript=[],allowed=new Set(['eth_chainId','eth_getTransactionByHash','eth_getTransactionReceipt','eth_getBlockByNumber','eth_getCode','eth_call','eth_getBalance','eth_getTransactionCount'])
const build=await approvedArtifact(),candidate=JSON.parse(await fs.readFile(new URL('../../docs/evidence/task6e/unsigned-deployment-candidate.json',import.meta.url)))
function client(url){return createPublicClient({transport:custom({request:async({method,params=[]})=>{
 if(!allowed.has(method))throw Error('Forbidden RPC method '+method)
 const {stdout}=await run('curl',['--silent','--show-error','--fail-with-body','--connect-timeout','5','--max-time','30','-H','Content-Type: application/json','--data-binary',JSON.stringify({jsonrpc:'2.0',id:1,method,params}),url],{maxBuffer:2*1024*1024})
 const reply=JSON.parse(stdout);transcript.push({url,at:new Date().toISOString(),method,params,reply});if(reply.error)throw Error(JSON.stringify(reply.error));return reply.result
 }},{retryCount:0})})}
const urls=['https://rpc.monad.xyz','https://rpc3.monad.xyz'],clients=urls.map(client)
const requireThat=(v,m)=>{if(!v)throw Error('VERIFICATION MISMATCH: '+m)}
try{
 const snapshot=await clients[0].getBlock({blockTag:'finalized'})
 const results=await Promise.all(clients.map(async(c,i)=>{
  const [chainId,tx,receipt,finalized,block,shared]=await Promise.all([c.getChainId(),c.getTransaction({hash}),c.getTransactionReceipt({hash}),c.getBlock({blockTag:'finalized'}),c.getBlock({blockNumber:113947533n}),c.getBlock({blockNumber:snapshot.number})])
  requireThat(chainId===143&&tx.chainId===143,'chain')
  requireThat(tx.hash===hash&&receipt.transactionHash===hash&&tx.from.toLowerCase()===sender.toLowerCase()&&receipt.from.toLowerCase()===sender.toLowerCase(),'transaction identity/sender')
  requireThat(tx.to===null&&receipt.to===null&&tx.value===0n&&tx.input.toLowerCase()===build.artifact.bytecode.object.toLowerCase(),'creation transaction/value/data')
  requireThat(receipt.status==='success'&&receipt.contractAddress?.toLowerCase()===address.toLowerCase()&&receipt.blockNumber===113947533n,'receipt status/address/block')
  requireThat(getContractAddress({from:tx.from,nonce:BigInt(tx.nonce)}).toLowerCase()===address.toLowerCase(),'CREATE derivation')
  requireThat(block.hash===receipt.blockHash&&tx.blockHash===receipt.blockHash&&finalized.number>=receipt.blockNumber&&shared.hash===snapshot.hash,'canonical inclusion/finality')
  const nftAbi=parseAbi(['function ownerOf(uint256) view returns (address)','function name() view returns (string)','function symbol() view returns (string)','function supportsInterface(bytes4) view returns (bool)'])
  const [atDeploy,runtime,nft,bindingAtDeploy,binding,balance,latestNonce,pendingNonce,owner,name,symbol,erc721,character,preview,title]=await Promise.all([
   c.getCode({address,blockNumber:receipt.blockNumber}),c.getCode({address,blockNumber:snapshot.number}),c.getCode({address:collection,blockNumber:snapshot.number}),
   c.readContract({address,abi:build.artifact.abi,functionName:'CHOG_GENESIS',blockNumber:receipt.blockNumber}),c.readContract({address,abi:build.artifact.abi,functionName:'CHOG_GENESIS',blockNumber:snapshot.number}),
   c.getBalance({address:sender,blockNumber:snapshot.number}),c.getTransactionCount({address:sender,blockTag:'latest'}),c.getTransactionCount({address:sender,blockTag:'pending'}),
   ...[['ownerOf',[1425n]],['name',[]],['symbol',[]],['supportsInterface',['0x80ac58cd']]].map(([functionName,args])=>c.readContract({address:collection,abi:nftAbi,functionName,args,blockNumber:snapshot.number})),
   ...[['characterOf',[1425n]],['preview',[1425n,1]],['titleOf',[1425n]]].map(([functionName,args])=>c.readContract({address,abi:build.artifact.abi,functionName,args,blockNumber:snapshot.number}))
  ])
  requireThat(atDeploy===build.runtime&&runtime===build.runtime,'exact full game runtime')
  requireThat(bindingAtDeploy.toLowerCase()===collection.toLowerCase()&&binding.toLowerCase()===collection.toLowerCase(),'NFT binding')
  requireThat(keccak256(nft)==='0x91aa1fd28371674abeb31670fd694cacaca57ac29cae579452c5150eb5dbab46'&&erc721,'collection runtime/ERC721')
  const unsigned=serializeTransaction({type:'eip1559',chainId:143,nonce:tx.nonce,gas:tx.gas,maxFeePerGas:tx.maxFeePerGas,maxPriorityFeePerGas:tx.maxPriorityFeePerGas,value:tx.value,data:tx.input,accessList:tx.accessList??[]})
  return{url:urls[i],chainId,tx,receipt,finalized:{number:finalized.number,hash:finalized.hash},deploymentBlockHash:block.hash,snapshot:{number:snapshot.number,hash:shared.hash,timestamp:shared.timestamp},runtimeHash:keccak256(runtime),collectionRuntimeHash:keccak256(nft),binding,balanceWei:balance,latestNonce,pendingNonce,reads:{tokenId:'1425',owner,name,symbol,erc721,character,preview,title},unsignedMatchesPreparedCandidate:unsigned===candidate.unsignedSerialized,actualSigningPayloadDigest:keccak256(unsigned),maximumCostWei:tx.gas*tx.maxFeePerGas,actualFeeWei:receipt.gasUsed*receipt.effectiveGasPrice}
 }))
 const comparable=r=>({...r,url:undefined,finalized:undefined})
 requireThat(stringify(comparable(results[0]))===stringify(comparable(results[1])),'independent provider agreement')
 const result={status:'VERIFIED_ON_CHAIN_NOT_EXPLORER_SOURCE_VERIFIED',capturedAt:new Date().toISOString(),address,hash,sender,sourceHash:build.sourceHash,creationHash:build.creationHash,runtimeHash:build.runtimeCodeHash,independentAgreement:true,results}
 await fs.writeFile(new URL('verification.json',dir),stringify(result),{flag:'wx'})
 console.log(stringify(result))
}finally{await fs.writeFile(new URL('rpc-transcript.json',dir),stringify(transcript),{flag:'wx'})}
