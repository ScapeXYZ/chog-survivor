// Read-only RPC collector and unsigned EIP-1559 candidate builder. No signing keys or signer API.
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {execFileSync} from 'node:child_process'
import {createHash} from 'node:crypto'
const root=new URL('../../../',import.meta.url),dir=new URL('./',import.meta.url)
const require=createRequire(new URL('frontend/package.json',root))
const {keccak256,encodeFunctionData,decodeFunctionResult,getContractAddress,toHex,zeroHash,serializeTransaction,parseTransaction}=require('viem')
const {approvedArtifact,collection}=await import(new URL('frontend/scripts/release-artifact.mjs',root))
const build=await approvedArtifact(),sender='0x320eDAe253259053d53feD8eEe6D9C0274A91E85'
const previous=JSON.parse(await fs.readFile(new URL('docs/evidence/task6d/governance-current.json',root)))
const abi=JSON.parse(await fs.readFile(new URL('docs/evidence/task6c/collection-abi.json',root)))
const allow=new Set(['eth_chainId','eth_getBlockByNumber','eth_getCode','eth_getBalance','eth_getTransactionCount','eth_gasPrice','eth_maxPriorityFeePerGas','eth_estimateGas','eth_call'])
const transcript=[]
function rpc(url,method,params){
 assert.ok(allow.has(method),'Forbidden RPC method')
 const row={url,method,params,at:new Date().toISOString()};transcript.push(row)
 try {
  const raw=execFileSync('curl',['--silent','--show-error','--fail-with-body','--connect-timeout','8','--max-time','20','-H','Content-Type: application/json','--data-binary',JSON.stringify({jsonrpc:'2.0',id:transcript.length,method,params}),url],{encoding:'utf8',maxBuffer:4*1024*1024,stdio:['ignore','pipe','pipe']})
  const answer=JSON.parse(raw);if(answer.error)throw Error(JSON.stringify(answer.error));if(!('result' in answer))throw Error('Missing RPC result');row.result=answer.result;return answer.result
 }catch(error){row.error=String(error.message).slice(0,600);throw Error(`${url} ${method}: ${row.error}`)}
}
const primary='https://rpc.monad.xyz',secondary='https://rpc3.monad.xyz',report={startedAt:new Date().toISOString(),sender,primary,secondary}
let failure
try{
 assert.equal(rpc(primary,'eth_chainId',[]),'0x8f')
 const block=rpc(primary,'eth_getBlockByNumber',['finalized',false]),tag=block.number
 const code=rpc(primary,'eth_getCode',[collection,tag]);assert.equal(keccak256(code),previous.collectionRuntimeHash)
 report.snapshot={number:BigInt(tag).toString(),hash:block.hash,timestamp:BigInt(block.timestamp).toString(),baseFeePerGas:BigInt(block.baseFeePerGas).toString()}
 report.collection={address:collection,runtimeHash:keccak256(code)}
 report.senderCode=rpc(primary,'eth_getCode',[sender,tag])
 report.balanceWei=BigInt(rpc(primary,'eth_getBalance',[sender,tag])).toString()
 report.latestNonce=BigInt(rpc(primary,'eth_getTransactionCount',[sender,'latest'])).toString()
 report.pendingNonce=BigInt(rpc(primary,'eth_getTransactionCount',[sender,'pending'])).toString()
 report.expectedCreateAddress=getContractAddress({from:sender,nonce:BigInt(report.pendingNonce)})
 report.expectedAddressCode=rpc(primary,'eth_getCode',[report.expectedCreateAddress,tag])
 report.gasPriceWei=BigInt(rpc(primary,'eth_gasPrice',[])).toString()
 report.prioritySuggestionWei=BigInt(rpc(primary,'eth_maxPriorityFeePerGas',[])).toString()
 const creation={from:sender,data:build.artifact.bytecode.object,value:'0x0'}
 report.creationEstimate=BigInt(rpc(primary,'eth_estimateGas',[creation])).toString()
 const bounded={...creation,gas:toHex(1600000n),maxFeePerGas:toHex(125000000000n),maxPriorityFeePerGas:toHex(2000000000n)}
 report.boundedEstimate=BigInt(rpc(primary,'eth_estimateGas',[bounded])).toString()
 const runtime=rpc(primary,'eth_call',[bounded,tag]);assert.equal(runtime.toLowerCase(),build.runtime.toLowerCase())
 report.boundedCreationRuntimeHash=keccak256(runtime)
 const read=(functionName,args=[])=>decodeFunctionResult({abi,functionName,data:rpc(primary,'eth_call',[{to:collection,data:encodeFunctionData({abi,functionName,args})},tag])})
 const state={};for(const name of ['maxSupply','reserveMax','stageMinted','reserveMinted','treasury','teamMain','revealed','baseURI','provenanceHash','startingIndex','currentStage'])state[name]=read(name)
 report.collection.state=state
 report.collection.knownAccounts={}
 const roles=[zeroHash,keccak256(new TextEncoder().encode('ADMIN_ROLE'))]
 for(const account of [...new Set([...Object.keys(previous.knownAccounts),state.treasury,state.teamMain])]){
  const accountCode=rpc(primary,'eth_getCode',[account,tag]),entry={code:accountCode,roles:{}}
  for(const role of roles)entry.roles[role]=read('hasRole',[role,account])
  if(/^0xef0100[0-9a-f]{40}$/i.test(accountCode))entry.delegationTarget='0x'+accountCode.slice(8)
  report.collection.knownAccounts[account]=entry
 }
 report.collection.roleAdmins=Object.fromEntries(roles.map(role=>[role,read('getRoleAdmin',[role])]))
 report.collection.delegationTargets={}
 for(const target of new Set(Object.values(report.collection.knownAccounts).map(e=>e.delegationTarget).filter(Boolean)))report.collection.delegationTargets[target]={codeHash:keccak256(rpc(primary,'eth_getCode',[target,tag])),activePermissions:'UNKNOWN: code capture does not enumerate signed off-chain delegations or custody'}
 const cross={};report.independent=cross
 try {
  cross.chainId=rpc(secondary,'eth_chainId',[])
  const other=rpc(secondary,'eth_getBlockByNumber',[tag,false]);cross.blockHash=other.hash;cross.blockHashMatches=other.hash===block.hash
  const otherCode=rpc(secondary,'eth_getCode',[collection,tag]);cross.collectionRuntimeHash=keccak256(otherCode);cross.collectionCodeMatches=otherCode===code
  cross.senderCode=rpc(secondary,'eth_getCode',[sender,tag]);cross.senderCodeMatches=cross.senderCode===report.senderCode
  cross.balanceWei=BigInt(rpc(secondary,'eth_getBalance',[sender,tag])).toString();cross.balanceMatches=cross.balanceWei===report.balanceWei
  cross.latestNonce=BigInt(rpc(secondary,'eth_getTransactionCount',[sender,'latest'])).toString();cross.pendingNonce=BigInt(rpc(secondary,'eth_getTransactionCount',[sender,'pending'])).toString()
  cross.gasPriceWei=BigInt(rpc(secondary,'eth_gasPrice',[])).toString();cross.creationEstimate=BigInt(rpc(secondary,'eth_estimateGas',[bounded])).toString()
  cross.matches=cross.chainId==='0x8f'&&cross.blockHashMatches&&cross.collectionCodeMatches&&cross.senderCodeMatches&&cross.balanceMatches&&cross.latestNonce===report.latestNonce&&cross.pendingNonce===report.pendingNonce
 }catch(error){cross.error=error.message;cross.matches=false}
 report.preparationChecks={nonceReady:report.latestNonce===report.pendingNonce,senderHasNoCode:report.senderCode==='0x',destinationUnused:report.expectedAddressCode==='0x',balanceCoversCapAndReserve:BigInt(report.balanceWei)>=300000000000000000n,estimateFits:BigInt(report.boundedEstimate)<=1600000n,basePlusProposedTipFits:BigInt(block.baseFeePerGas)+2000000000n<=125000000000n,independentMatches:cross.matches}
 assert.ok(Object.values(report.preparationChecks).every(Boolean),'Candidate preparation check failed; no signing candidate approved')
 const transaction={type:'eip1559',chainId:143,nonce:Number(report.pendingNonce),gas:1600000n,maxFeePerGas:125000000000n,maxPriorityFeePerGas:2000000000n,value:0n,data:build.artifact.bytecode.object,accessList:[]}
 assert.ok(Number.isSafeInteger(transaction.nonce))
 const unsignedSerialized=serializeTransaction(transaction),parsed=parseTransaction(unsignedSerialized)
 assert.equal(parsed.to,undefined);assert.equal(parsed.data,transaction.data);assert.equal(parsed.gas,transaction.gas);assert.equal(parsed.r,undefined);assert.equal(parsed.s,undefined)
 const sheet={status:'UNSIGNED PROPOSAL — NOT APPROVED FOR SIGNING OR BROADCAST',preparedAt:new Date().toISOString(),from:sender,...transaction,to:null,constructorArguments:[],sourceHash:build.sourceHash,creationHash:build.creationHash,expectedRuntimeHash:build.runtimeCodeHash,expectedCreateAddress:report.expectedCreateAddress,gameArtifactFileSHA256:createHash('sha256').update(await fs.readFile(new URL('out/ChogSurvivor.sol/ChogSurvivor.json',root))).digest('hex'),maximumCostWei:'200000000000000000',minimumRemainingWei:'100000000000000000',unsignedSerialized,signingPayloadKeccak256:keccak256(unsignedSerialized),transactionHash:null,signature:null,authorization:null,nonceExpiry:'Not approved: refresh nonce and all state immediately before future authorization; never silently update this proposal.'}
 await fs.writeFile(new URL('unsigned-deployment-candidate.json',dir),JSON.stringify(sheet,(_,v)=>typeof v==='bigint'?v.toString():v,2)+'\n',{flag:'wx'})
}catch(error){failure=error.message;report.error=failure;process.exitCode=1}
report.finishedAt=new Date().toISOString()
await fs.writeFile(new URL('rpc-refresh.json',dir),JSON.stringify(report,(_,v)=>typeof v==='bigint'?v.toString():v,2)+'\n',{flag:'wx'})
await fs.writeFile(new URL('rpc-transcript.json',dir),JSON.stringify(transcript,null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({snapshot:report.snapshot,preparationChecks:report.preparationChecks,error:failure??null},null,2))
