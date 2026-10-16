// Read-only primary-provider governance/custody observations. No wallet/signing API.
import fs from 'node:fs/promises'
import {createRequire} from 'node:module'
const root=new URL('../../../',import.meta.url),require=createRequire(new URL('frontend/package.json',root))
const {createPublicClient,http,keccak256,zeroHash,parseAbi}=require('viem')
const collection='0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763',sender='0x320eDAe253259053d53feD8eEe6D9C0274A91E85'
const prior=JSON.parse(await fs.readFile(new URL('docs/evidence/task6c/collection-provenance.json',root)))
const abi=JSON.parse(await fs.readFile(new URL('docs/evidence/task6c/collection-abi.json',root)))
const client=createPublicClient({transport:http('https://rpc.monad.xyz',{timeout:15000,retryCount:1})})
if(await client.getChainId()!==143)throw Error('Wrong chain')
const block=await client.getBlock({blockTag:'finalized'}),at={blockNumber:block.number}
const code=await client.getCode({address:collection,...at})
if(keccak256(code)!==prior.runtimeReproduction.runtimeHash)throw Error('Collection runtime changed')
const creationBlock=await client.getBlock({blockNumber:BigInt(prior.receipt.blockNumber)})
if(creationBlock.hash!==prior.receipt.blockHash)throw Error('Creation inclusion changed')
const accounts=[...new Set([prior.tx.from,prior.constructor.treasury,prior.constructor.teamMain])]
const roles=[zeroHash,keccak256(new TextEncoder().encode('ADMIN_ROLE'))]
const evidence={capturedAt:new Date().toISOString(),provider:'https://rpc.monad.xyz',chainId:143,block:{number:block.number,hash:block.hash,timestamp:block.timestamp},collection,collectionRuntimeHash:keccak256(code),creationBlockHashVerified:creationBlock.hash,knownAccounts:{},roleAdmins:{},state:{},sample:{tokenId:'1425'},deployer:{address:sender}}
for(const role of roles)evidence.roleAdmins[role]=await client.readContract({address:collection,abi,functionName:'getRoleAdmin',args:[role],...at})
for(const account of accounts){
 const runtime=await client.getCode({address:account,...at})??'0x'
 const e={code:runtime,roles:{},custody:'UNKNOWN: code does not identify people, hardware custody or key-sharing policy'}
 for(const role of roles)e.roles[role]=await client.readContract({address:collection,abi,functionName:'hasRole',args:[role,account],...at})
 evidence.knownAccounts[account]=e
}
for(const name of ['treasury','teamMain','revealed','baseURI','provenanceHash','startingIndex','maxSupply','reserveMax','stageMinted','reserveMinted','currentStage'])evidence.state[name]=await client.readContract({address:collection,abi,functionName:name,...at})
for(const name of ['ownerOf','getApproved'])evidence.sample[name]=await client.readContract({address:collection,abi,functionName:name,args:[1425n],...at})
evidence.sample.royaltyInfo=await client.readContract({address:collection,abi,functionName:'royaltyInfo',args:[1425n,10000n],...at})
evidence.deployer.balanceWei=await client.getBalance({address:sender,...at});evidence.deployer.code=await client.getCode({address:sender,...at})??'0x'
evidence.deployer.latestNonce=await client.getTransactionCount({address:sender,blockTag:'latest'});evidence.deployer.pendingNonce=await client.getTransactionCount({address:sender,blockTag:'pending'})
evidence.deployer.gasPrice=await client.getGasPrice()
evidence.limitations=['Known accounts only; complete current role membership needs indexed RoleGranted/RoleRevoked history.','Empty account code does not attest custody, key holders or a hardware wallet.','Sample getApproved does not enumerate operator approvals or other tokens.']
console.log(JSON.stringify(evidence,(_,v)=>typeof v==='bigint'?v.toString():v,2))
