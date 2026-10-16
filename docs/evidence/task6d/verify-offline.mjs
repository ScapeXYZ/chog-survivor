// Offline review evidence only. No network, signer, compiler or test-suite execution.
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {createRequire} from 'node:module'
const root=new URL('../../../',import.meta.url)
const require=createRequire(new URL('frontend/package.json',root))
const {keccak256,toHex,decodeAbiParameters,getContractAddress}=require('viem')
const {approvedArtifact}=await import(new URL('frontend/scripts/release-artifact.mjs',root))
const read=async name=>JSON.parse(await fs.readFile(new URL('docs/evidence/task6c/'+name,root)))
const game=await approvedArtifact(), input=await read('collection-standard-input.json'), output=await read('collection-compiler-output.json'), capture=await read('collection-provenance.json'), rpc=await read('rpc-refresh.json')
const metadata=JSON.parse(output.contracts['src/ChogMint.sol'].ChogMint.metadata)
for(const [name,value] of Object.entries(input.sources))assert.equal(keccak256(toHex(value.content)),metadata.sources[name].keccak256,'source content '+name)
const contract=output.contracts['src/ChogMint.sol'].ChogMint
assert.equal(metadata.compiler.version,'0.8.28+commit.7893614a');assert.equal(metadata.settings.optimizer.runs,800);assert.equal(metadata.settings.evmVersion,'cancun')
assert.equal(capture.tx.chainId,143);assert.equal(capture.tx.to,null);assert.equal(capture.tx.value,'0');assert.equal(capture.receipt.status,'success')
assert.equal(capture.tx.blockHash,capture.receipt.blockHash)
assert.equal(capture.tx.hash,capture.receipt.transactionHash)
const collection='0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763'
assert.equal(capture.receipt.contractAddress.toLowerCase(),collection)
assert.equal(getContractAddress({from:capture.tx.from,nonce:BigInt(capture.tx.nonce)}).toLowerCase(),collection)
assert.ok(capture.tx.input.slice(2).startsWith(contract.evm.bytecode.object))
const ctor=decodeAbiParameters(contract.abi.find(x=>x.type==='constructor').inputs,'0x'+capture.tx.input.slice(2+contract.evm.bytecode.object.length))[0]
let runtime=contract.evm.deployedBytecode.object
for(const {id,value} of capture.runtimeReproduction.immutableGroups)for(const ref of contract.evm.deployedBytecode.immutableReferences[id])runtime=runtime.slice(0,ref.start*2)+toHex(BigInt(value),{size:32}).slice(2)+runtime.slice((ref.start+ref.length)*2)
assert.equal('0x'+runtime,rpc.reports[0].code)
const baseline=JSON.parse(await fs.readFile(new URL('docs/evidence/task6c/changed-file-security-inventory.json',root)))
const compared=[]
for(const row of baseline.files.filter(row=>/^(frontend\/(src|scripts)\/|src\/|test\/|script\/)/.test(row.path))){const current=createHash('sha256').update(await fs.readFile(new URL(row.path,root))).digest('hex');assert.equal(current,row.sha256,row.path);compared.push(row.path)}
const artifact=JSON.parse(await fs.readFile(new URL('out/ChogSurvivor.sol/ChogSurvivor.json',root)))
const report={capturedAt:new Date().toISOString(),offlineOnly:true,noSuitesRepeated:true,sourceBaselineFilesMatched:compared.length,sourceHash:game.sourceHash,gameCreationHash:game.creationHash,gameExpectedRuntimeHash:game.runtimeCodeHash,gameArtifactFileSHA256:createHash('sha256').update(await fs.readFile(new URL('out/ChogSurvivor.sol/ChogSurvivor.json',root))).digest('hex'),gameCreationBytes:(artifact.bytecode.object.length-2)/2,gameRuntimeBytes:(game.runtime.length-2)/2,gameCompiler:game.compiler,gameOptimizer:game.settings.optimizer,gameEVM:game.settings.evmVersion,collectionSourceHashesVerified:Object.keys(input.sources).length,collectionCreationPrefixAndConstructorVerified:true,collectionAddressDerivationVerified:true,collectionRuntimeHash:keccak256('0x'+runtime),collectionConstructor:{maxSupply:ctor.maxSupply.toString(),reserveMax:ctor.reserveMax.toString(),admins:ctor.admins},recommendedLimits:{sender:'0x320eDAe253259053d53feD8eEe6D9C0274A91E85',chainId:143,gasLimit:'1600000',maxFeePerGasWei:'125000000000',maxCostWei:(1600000n*125000000000n).toString(),minimumReserveWei:'100000000000000000',minimumStartingBalanceWei:(1600000n*125000000000n+100000000000000000n).toString(),approved:false},limitations:['Consistency reproduction uses retained compiler output; an independent reviewer should rebuild the source input with the pinned compiler.','Historical RPC snapshots are not fresh balance/fee/role attestations.']}
console.log(JSON.stringify(report,null,2))
