// Offline integration audit. Reuses Task 7A deployment evidence; no RPC or signer.
import fs from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import ts from 'typescript'
import {toFunctionSelector} from 'viem'
import {approvedArtifact,collection} from './release-artifact.mjs'
const root=new URL('../../',import.meta.url),build=await approvedArtifact()
async function constants(file,names){
 const code=await fs.readFile(new URL(file,root),'utf8'),ast=ts.createSourceFile(file,code,ts.ScriptTarget.ES2022,true,ts.ScriptKind.TS),declarations=[]
 function visit(node){if(ts.isVariableDeclaration(node)&&names.includes(node.name.getText(ast)))declarations.push(`export const ${node.name.getText(ast)}=${node.initializer.getText(ast)};`);ts.forEachChild(node,visit)}
 visit(ast);assert.equal(declarations.length,names.length)
 const js=ts.transpileModule(declarations.join('\n'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText
 return import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'))
}
const {gameReadAbi,gameLocalWriteAbi,CHOG_GENESIS,MONAD_CHAIN_ID}=await constants('frontend/src/contracts.ts',['gameReadAbi','gameLocalWriteAbi','CHOG_GENESIS','MONAD_CHAIN_ID'])
const {mainnetDeployment,mainnetDeploymentReceipt}=await constants('frontend/src/mainnetDeployment.ts',['mainnetDeployment','mainnetDeploymentReceipt'])
const evidence=JSON.parse(await fs.readFile(new URL('docs/evidence/task7a/verification.json',root),'utf8'))
assert.equal(MONAD_CHAIN_ID,143);assert.equal(CHOG_GENESIS,collection)
assert.equal(mainnetDeployment.address,evidence.address);assert.equal(mainnetDeployment.chainId,143);assert.equal(mainnetDeployment.deploymentBlock,113947533n);assert.equal(mainnetDeployment.runtimeCodeHash,build.runtimeCodeHash)
assert.equal(mainnetDeploymentReceipt.transactionHash,evidence.hash);assert.equal(mainnetDeploymentReceipt.monadScanUrl,`https://monadscan.com/tx/${evidence.hash}`)
const shape=p=>p.type.startsWith('tuple')?`(${p.components.map(shape).join(',')})${p.type.slice(5)}`:p.type
const abiChecks=[]
for(const fn of [...gameReadAbi,...gameLocalWriteAbi]){
 const exact=build.artifact.abi.find(x=>x.type==='function'&&x.name===fn.name);assert.ok(exact)
 assert.equal(toFunctionSelector(fn),toFunctionSelector(exact));assert.equal(fn.stateMutability,exact.stateMutability)
 if(fn.name!=='act')assert.deepEqual(fn.outputs.map(shape),exact.outputs.map(shape))
 abiChecks.push({name:fn.name,selector:toFunctionSelector(fn),inputsMatch:true,returns:fn.name==='act'?'Encoding-only ABI intentionally omits unused return; confirmed events establish results':'Exact tuple/type layout'})
}
assert.deepEqual(gameLocalWriteAbi.map(fn=>fn.name),['act'])
const vercel=JSON.parse(await fs.readFile(new URL('frontend/vercel.json',root),'utf8'));assert.ok(vercel.buildCommand.includes('VITE_CHOG_ENV=production'));assert.ok(!vercel.buildCommand.includes('VITE_CHOG_ENV=mainnet'))
const sourceInput=JSON.parse(await fs.readFile(new URL('docs/evidence/task7a/source-verification-input.json',root),'utf8'))
assert.equal(createHash('sha256').update(sourceInput.sources['src/ChogSurvivor.sol'].content).digest('hex'),build.sourceHash)
assert.equal(sourceInput.settings.evmVersion,'cancun');assert.equal(sourceInput.settings.optimizer.runs,200);assert.equal(sourceInput.settings.optimizer.enabled,true);assert.equal(sourceInput.settings.metadata.bytecodeHash,'ipfs')
console.log(JSON.stringify({status:'PASS',offlineOnly:true,reusesTask7AProof:true,chainId:143,game:mainnetDeployment.address,nft:CHOG_GENESIS,runtimeHash:build.runtimeCodeHash,abiChecks,publicHostingForcesSimulation:true,sourceVerificationPackageUnchanged:true,sourceSubmitted:false},null,2))
