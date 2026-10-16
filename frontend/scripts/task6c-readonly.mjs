// Read-only evidence collector: explicit method allowlist, no wallet or signing API.
import fs from 'node:fs/promises'
import {createPublicClient, http, keccak256, parseAbi, getContractAddress, toHex, toFunctionSelector} from 'viem'
import {approvedArtifact, collection} from './release-artifact.mjs'
const output = new URL('../../docs/evidence/task6c/', import.meta.url)
const sender = '0x320eDAe253259053d53feD8eEe6D9C0274A91E85'
const build = await approvedArtifact()
const allowed = new Set(['eth_chainId','eth_getBlockByNumber','eth_getCode','eth_getBalance','eth_getTransactionCount','eth_gasPrice','eth_maxPriorityFeePerGas','eth_estimateGas','eth_call','eth_getStorageAt'])
const reports = []
for (const url of ['https://rpc.monad.xyz','https://rpc2.monad.xyz']) {
  const transcript = []
  const base = http(url,{timeout:15000,retryCount:0})({})
  const client = createPublicClient({transport: () => ({...base, request: async args => {
    if (!allowed.has(args.method)) throw Error('Forbidden RPC method')
    try {const result=await base.request(args);transcript.push({...args,result});return result}
    catch(error){transcript.push({...args,error:error.shortMessage??error.message});throw error}
  }})})
  const e = {url,capturedAt:new Date().toISOString(),sender}
  try {
    e.chainId=await client.getChainId();if(e.chainId!==143)throw Error('Wrong chain')
    const block=await client.getBlock({blockTag:'finalized'});e.block={number:block.number,hash:block.hash,timestamp:block.timestamp,baseFeePerGas:block.baseFeePerGas}
    const at={blockNumber:block.number}
    e.code=await client.getCode({address:collection,...at});e.collectionRuntimeHash=keccak256(e.code)
    e.balanceWei=await client.getBalance({address:sender,...at});e.senderCode=await client.getCode({address:sender,...at})??'0x'
    e.latestNonce=await client.getTransactionCount({address:sender,blockTag:'latest'});e.pendingNonce=await client.getTransactionCount({address:sender,blockTag:'pending'})
    e.expectedCreateAddress=getContractAddress({from:sender,nonce:BigInt(e.pendingNonce)})
    e.expectedAddressCode=await client.getCode({address:e.expectedCreateAddress,...at})??'0x'
    e.gasPrice=await client.getGasPrice();e.priorityFee=await client.estimateMaxPriorityFeePerGas()
    e.creationEstimate=await client.estimateGas({account:sender,data:build.artifact.bytecode.object})
    // Confirm the proposed 1.6M gas limit executes as eth_call; never submits a transaction.
    const runtime=await client.call({account:sender,data:build.artifact.bytecode.object,gas:1600000n,...at})
    e.creationCallRuntimeHash=keccak256(runtime.data);e.runtimeMatches=runtime.data?.toLowerCase()===build.runtime.toLowerCase()
    e.probes={}
    for(const signature of ['name() view returns (string)','symbol() view returns (string)','owner() view returns (address)','paused() view returns (bool)','totalSupply() view returns (uint256)','ownerOf(uint256) view returns (address)','supportsInterface(bytes4) view returns (bool)']) {
      const name=signature.split('(')[0],args=name==='ownerOf'?[1425n]:name==='supportsInterface'?['0x80ac58cd']:[]
      try{e.probes[name]={value:await client.readContract({address:collection,abi:parseAbi(['function '+signature]),functionName:name,args,...at})}}
      catch(error){e.probes[name]={error:error.shortMessage??error.message}}
    }
    e.slots={}
    for(const label of ['implementation','admin','beacon']) {
      const slot=toHex(BigInt(keccak256(new TextEncoder().encode('eip1967.proxy.'+label)))-1n,{size:32})
      e.slots[label]={slot,value:await client.getStorageAt({address:collection,slot,...at})}
    }
    // Disassemble instructions; skip PUSH data so opcode findings are not byte-string guesses.
    const bytes=Buffer.from(e.code.slice(2),'hex'),selectors=[],opcodes={}
    for(let pc=0;pc<bytes.length;pc++){const op=bytes[pc];if([0xf4,0xf2,0xff].includes(op))(opcodes[op]??=[]).push(pc);if(op===0x63)selectors.push('0x'+bytes.subarray(pc+1,pc+5).toString('hex'));if(op>=0x60&&op<=0x7f)pc+=op-0x5f}
    e.opcodeOffsets=opcodes;e.push4Constants=[...new Set(selectors)].sort()
    e.selectorHints=Object.fromEntries(['owner()','transferOwnership(address)','renounceOwnership()','pause()','unpause()','burn(uint256)','setBaseURI(string)','setApprovalForAll(address,bool)','transferFrom(address,address,uint256)','upgradeToAndCall(address,bytes)'].map(sig=>[sig,e.push4Constants.includes(toFunctionSelector(sig))]))
  }catch(error){e.error=error.shortMessage??error.message}
  reports.push(e)
  await fs.writeFile(new URL(url.includes('rpc2')?'rpc2-transcript.json':'rpc1-transcript.json',output),JSON.stringify(transcript,(_,v)=>typeof v==='bigint'?v.toString():v,2)+'\n',{flag:'wx'})
}
// At one exact finalized block, compare both endpoints; provider branding alone is not consensus proof.
const reference=reports[0]
if(reference.block&&reports[1].block){
  const client=createPublicClient({transport:http(reports[1].url,{timeout:15000,retryCount:0})})
  try{const blockNumber=reference.block.number;const [block,code,balance]=await Promise.all([client.getBlock({blockNumber}),client.getCode({address:collection,blockNumber}),client.getBalance({address:sender,blockNumber})]);reports[1].sameBlockCrossCheck={blockNumber,hash:block.hash,hashMatches:block.hash===reference.block.hash,codeHash:keccak256(code),codeMatches:code===reference.code,balanceWei:balance,balanceMatches:balance===reference.balanceWei}}catch(error){reports[1].crossCheckError=error.shortMessage??error.message}
}
await fs.writeFile(new URL('rpc-refresh.json',output),JSON.stringify({capturedAt:new Date().toISOString(),sourceHash:build.sourceHash,creationHash:build.creationHash,expectedRuntimeHash:build.runtimeCodeHash,reports},(_,v)=>typeof v==='bigint'?v.toString():v,2)+'\n',{flag:'wx'})
console.log(JSON.stringify(reports.map(({code,push4Constants,...e})=>e),(_,v)=>typeof v==='bigint'?v.toString():v,2))

// A partial capture must not look like a successful gate check.
if (reports.some(report => report.error)) process.exitCode = 2
