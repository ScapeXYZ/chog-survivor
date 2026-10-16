// Read-only explorer-source reproduction and authority evidence; no signer.
import fs from 'node:fs/promises'
import {createPublicClient,http,decodeAbiParameters,keccak256,zeroHash,getContractAddress,parseAbi,toHex} from 'viem'
const dir=new URL('../../docs/evidence/task6c/',import.meta.url),collection='0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763'
const compilation=JSON.parse(await fs.readFile(new URL('collection-compiler-output.json',dir)))
const artifact=compilation.contracts['src/ChogMint.sol'].ChogMint,abi=artifact.abi
const client=createPublicClient({transport:http('https://rpc.monad.xyz',{timeout:20000,retryCount:1})})
const hash='0x23347f41b8c921039de31853994b29f21b2c9f2547d97145e64acc93a09ae4bd'
const [tx,receipt,block]=await Promise.all([client.getTransaction({hash}),client.getTransactionReceipt({hash}),client.getBlock({blockTag:'finalized'})])
const e={capturedAt:new Date().toISOString(),tx,receipt,snapshot:{number:block.number,hash:block.hash},creationMatches:tx.input.slice(2).startsWith(artifact.evm.bytecode.object),addressMatches:getContractAddress({from:tx.from,nonce:BigInt(tx.nonce)}).toLowerCase()===collection.toLowerCase()}
const parameters=abi.find(x=>x.type==='constructor').inputs
if(!e.creationMatches)throw Error('Collection creation prefix mismatch')
e.constructor=decodeAbiParameters(parameters,'0x'+tx.input.slice(2+artifact.evm.bytecode.object.length))[0]
let runtime=artifact.evm.deployedBytecode.object
const p=e.constructor
// Solidity immutable IDs are identified from AST-independent constructor values: match candidates via RPC getters.
const refs=artifact.evm.deployedBytecode.immutableReferences
const groups=Object.entries(refs)
const candidates=[p.maxSupply,p.reserveMax]
let match
for(const order of [candidates,[...candidates].reverse()]){
 let code=runtime
 groups.forEach(([_,items],i)=>{for(const ref of items)code=code.slice(0,ref.start*2)+toHex(order[i],{size:32}).slice(2)+code.slice((ref.start+ref.length)*2)})
 const live=await client.getCode({address:collection,blockNumber:block.number})
 if(('0x'+code).toLowerCase()===live.toLowerCase())match={runtimeHash:keccak256(live),immutableGroups:groups.map(([id],i)=>({id,value:order[i]})),fullRuntimeMatches:true}
}
e.runtimeReproduction=match??{fullRuntimeMatches:false}
e.state={}
for(const name of ['ADMIN_ROLE','DEFAULT_ADMIN_ROLE','maxSupply','reserveMax','stageMinted','reserveMinted','treasury','teamMain','revealed','baseURI','placeholderURI','provenanceHash','startingIndex','currentStage']){
 try{e.state[name]=await client.readContract({address:collection,abi,functionName:name,blockNumber:block.number})}catch(error){e.state[name]={error:error.shortMessage??error.message}}
}
e.roles={}
const accounts=[...new Set([tx.from,p.treasury,p.teamMain,...p.admins,e.state.treasury,e.state.teamMain])]
for(const role of [zeroHash,keccak256(new TextEncoder().encode('ADMIN_ROLE'))]){
 e.roles[role]={admin:await client.readContract({address:collection,abi,functionName:'getRoleAdmin',args:[role],blockNumber:block.number}),accounts:{}}
 for(const account of accounts)e.roles[role].accounts[account]=await client.readContract({address:collection,abi,functionName:'hasRole',args:[role,account],blockNumber:block.number})
}
e.roleHistory={}
for(const url of ['https://rpc.monad.xyz','https://rpc2.monad.xyz']){
 try{const c=createPublicClient({transport:http(url,{timeout:20000,retryCount:0})});e.roleHistory[url]=await c.getLogs({address:collection,events:parseAbi(['event RoleGranted(bytes32 indexed role,address indexed account,address indexed sender)','event RoleRevoked(bytes32 indexed role,address indexed account,address indexed sender)','event RoleAdminChanged(bytes32 indexed role,bytes32 indexed previousAdminRole,bytes32 indexed newAdminRole)']),fromBlock:receipt.blockNumber,toBlock:block.number})}
 catch(error){e.roleHistory[url]={error:error.shortMessage??error.message,complete:false}}
}
// Strip compiler CBOR trailer before interpreting executable instruction bytes.
const code=Buffer.from(runtime,'hex'),metadataLength=code.readUInt16BE(code.length-2),end=code.length-metadataLength-2,opcodes={}
for(let pc=0;pc<end;pc++){const op=code[pc];if([0xf4,0xf2,0xff].includes(op))(opcodes[op]??=[]).push(pc);if(op>=0x60&&op<=0x7f)pc+=op-0x5f}
e.executableOpcodeOffsets=opcodes;e.metadataBytes=metadataLength+2
e.limitations=['Role checks cover known constructor/current treasury/team addresses, not all possible grantees unless full log history succeeds.','Source/runtime match does not authenticate the project team or establish signer custody.']
await fs.writeFile(new URL('collection-provenance.json',dir),JSON.stringify(e,(_,v)=>typeof v==='bigint'?v.toString():v,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({creationMatches:e.creationMatches,addressMatches:e.addressMatches,constructor:e.constructor,runtimeReproduction:e.runtimeReproduction,state:e.state,roles:e.roles,roleHistory:e.roleHistory,executableOpcodeOffsets:e.executableOpcodeOffsets},(_,v)=>typeof v==='bigint'?v.toString():v,2))
