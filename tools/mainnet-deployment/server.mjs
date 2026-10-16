// Local-only review server. No signer, account secrets, generic RPC proxy or broadcast endpoint.
import http from 'node:http'
import fs from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {createRequire} from 'node:module'
import {execFile} from 'node:child_process'
import {promisify} from 'node:util'
import {fileURLToPath} from 'node:url'
import {expected,collectionRuntimeHash,validateCandidate,validatePreflight,walletRequest} from './model.mjs'
const root=new URL('../../',import.meta.url),here=new URL('./',import.meta.url)
const require=createRequire(new URL('frontend/package.json',root)),crypto=require('viem'),esbuild=require('esbuild'),run=promisify(execFile)
export async function loadConfig() {
 const bytes=await fs.readFile(new URL('docs/evidence/task6e/unsigned-deployment-candidate.json',root))
 if(createHash('sha256').update(bytes).digest('hex')!==expected.candidateSHA256)throw Error('Candidate JSON changed')
 const candidate=validateCandidate(JSON.parse(bytes),crypto)
 const {approvedArtifact}=await import(new URL('frontend/scripts/release-artifact.mjs',root)),build=await approvedArtifact()
 if(build.runtimeCodeHash!==expected.runtimeHash||build.creationHash!==expected.creationHash||candidate.data!==build.artifact.bytecode.object)throw Error('Artifact mismatch')
 const artifact=await fs.readFile(new URL('out/ChogSurvivor.sol/ChogSurvivor.json',root))
 if(createHash('sha256').update(artifact).digest('hex')!==expected.artifactHash)throw Error('Artifact file changed')
 return {candidate,ownerDecision:JSON.parse(await fs.readFile(new URL('owner-risk-acceptance.json',here))),authorization:JSON.parse(await fs.readFile(new URL('authorization.json',here))),expected,binding:expected.collection,constructorArguments:[],request:walletRequest(candidate)}
}
export async function freshPreflight(candidate,{readRpc}={}) {
 const startedAt=Date.now()
 const checked=await loadConfig();if(candidate.data!==checked.candidate.data)throw Error('Candidate changed')
 const allowed=new Set(['eth_chainId','eth_getBlockByNumber','eth_getCode','eth_getBalance','eth_getTransactionCount','eth_estimateGas','eth_call'])
 const rpc=async(url,method,params)=>{
  if(!allowed.has(method))throw Error('Forbidden RPC method')
  // Test-only in-process reader injection; the HTTP/CLI interfaces expose no override.
  if(readRpc)return readRpc(url,method,params)
  const {stdout}=await run('curl',['--silent','--show-error','--fail-with-body','--connect-timeout','5','--max-time','15','-H','Content-Type: application/json','--data-binary',JSON.stringify({jsonrpc:'2.0',id:1,method,params}),url],{maxBuffer:1024*1024})
  const reply=JSON.parse(stdout);if(reply.error||!('result'in reply))throw Error('Read-only RPC failed');return reply.result
 }
 const primary='https://rpc.monad.xyz',other='https://rpc3.monad.xyz'
 const [chain,block]=await Promise.all([rpc(primary,'eth_chainId',[]),rpc(primary,'eth_getBlockByNumber',['finalized',false])])
 const request=walletRequest(candidate),readCreation={...request};delete readCreation.chainId;delete readCreation.type;delete readCreation.nonce
 const params=[['eth_getBalance',[expected.sender,block.number]],['eth_getCode',[expected.sender,block.number]],['eth_getTransactionCount',[expected.sender,'latest']],['eth_getTransactionCount',[expected.sender,'pending']],['eth_getCode',[expected.collection,block.number]],['eth_getCode',[expected.createAddress,block.number]],['eth_estimateGas',[readCreation]]]
 const [values,cross,runtime,otherRuntime]=await Promise.all([Promise.all(params.map(([m,p])=>rpc(primary,m,p))),Promise.all([rpc(other,'eth_chainId',[]),rpc(other,'eth_getBlockByNumber',[block.number,false]),...params.map(([m,p])=>rpc(other,m,p))]),rpc(primary,'eth_call',[readCreation,block.number]),rpc(other,'eth_call',[readCreation,block.number])])
 const [balance,code,latest,pending,nft,destination,estimate]=values
 if(Date.now()-Number(BigInt(block.timestamp))*1000>120000||Number(BigInt(block.timestamp))*1000>Date.now()+10000)throw Error('RPC finalized block is stale or future dated')
 const {approvedArtifact}=await import(new URL('frontend/scripts/release-artifact.mjs',root));const finalBuild=await approvedArtifact();await loadConfig();if(runtime!==finalBuild.runtime||otherRuntime!==finalBuild.runtime)throw Error('Both creation simulations must return exact bound artifact runtime')
 const independentMatches=runtime===otherRuntime&&cross[1]?.baseFeePerGas===block.baseFeePerGas&&cross[0]===chain&&cross[1]?.hash===block.hash&&values.every((v,i)=>JSON.stringify(v)===JSON.stringify(cross[i+2]))
 return validatePreflight({sourceSHA256:expected.sourceHash,artifactSHA256:expected.artifactHash,creationHash:expected.creationHash,nftBinding:expected.collection,bothCreationSimulationsMatch:runtime===otherRuntime,providers:[primary,other],chainId:Number(BigInt(chain)),checkedAt:startedAt,blockTimestamp:Number(BigInt(block.timestamp)),blockNumber:BigInt(block.number).toString(),blockHash:block.hash,balanceWei:BigInt(balance).toString(),senderCode:code,latestNonce:BigInt(latest).toString(),pendingNonce:BigInt(pending).toString(),collectionRuntimeHash:crypto.keccak256(nft),expectedAddressCode:destination,estimateGas:BigInt(estimate).toString(),baseFeePerGas:BigInt(block.baseFeePerGas).toString(),creationRuntimeHash:crypto.keccak256(runtime),independentMatches})
}
export async function createReviewServer({config:provided,preflight=freshPreflight}={}) {
 const config=provided??await loadConfig()
 const bundle=await esbuild.build({entryPoints:[fileURLToPath(new URL('app.mjs',here))],bundle:true,write:false,format:'esm',platform:'browser',nodePaths:[fileURLToPath(new URL('frontend/node_modules',root))],logLevel:'silent'})
 const assets={'/':{body:await fs.readFile(new URL('index.html',here)),type:'text/html; charset=utf-8'},'/app.js':{body:bundle.outputFiles[0].contents,type:'text/javascript; charset=utf-8'},'/style.css':{body:await fs.readFile(new URL('style.css',here)),type:'text/css; charset=utf-8'}}
 let reading=false
 const server=http.createServer(async(req,res)=>{
  const origin=`http://127.0.0.1:${server.address().port}`
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer')
  res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'")
  try {
   if(req.headers.host!==`127.0.0.1:${server.address().port}`||(req.headers.origin&&req.headers.origin!==origin)) {res.writeHead(403);res.end('Local origin required');return}
   if(req.method==='GET'&&Object.hasOwn(assets,req.url)){const asset=assets[req.url];res.setHeader('Content-Type',asset.type);res.end(asset.body);return}
   if(req.method==='GET'&&req.url==='/config'){const current=provided?config:{...config,ownerDecision:JSON.parse(await fs.readFile(new URL('owner-risk-acceptance.json',here))),authorization:JSON.parse(await fs.readFile(new URL('authorization.json',here)))};res.setHeader('Content-Type','application/json');res.end(JSON.stringify(current));return}
   if(req.method==='POST'&&req.url==='/preflight'){
    if(req.headers.origin!==origin||req.headers['content-type']!=='application/json'||reading){res.writeHead(403);res.end('Explicit same-origin preflight required');return}
    let bytes=0;for await(const chunk of req){bytes+=chunk.length;if(bytes>128)throw Error('Request too large')}
    reading=true
    try{const result=await preflight(config.candidate);res.setHeader('Content-Type','application/json');res.end(JSON.stringify(result))}finally{reading=false}
    return
   }
   res.writeHead(404);res.end('Not found')
  }catch(error){res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({error:error.message}))}
 })
 return server
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
 const server=await createReviewServer()
 server.listen(9546,'127.0.0.1',()=>console.log('Local deployment review: http://127.0.0.1:9546 — choose the explicit independent or owner-unaudited review path. No signature/broadcast authorized by starting this server. No wallet opens automatically.'))
}
