// Offline tests exercise the real dual-provider collector, with no network or signer.
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {loadConfig,freshPreflight} from './server.mjs'
import {expected} from './model.mjs'
import {approvedArtifact} from '../../frontend/scripts/release-artifact.mjs'
const {candidate}=await loadConfig(),{runtime}=await approvedArtifact()
const historical=JSON.parse(await fs.readFile(new URL('../../docs/evidence/task6c/rpc-refresh.json',import.meta.url)))
const nft=historical.reports[0].code
function fixture(change=()=>undefined){
 const calls=[]
 const readRpc=async(url,method,params)=>{
  calls.push({url,method,params});const altered=change(url,method,params);if(altered!==undefined)return altered
  if(method==='eth_chainId')return '0x8f'
  if(method==='eth_getBlockByNumber')return {number:'0x123',hash:'0x'+'ab'.repeat(32),timestamp:'0x'+Math.floor(Date.now()/1000).toString(16),baseFeePerGas:'0x174876e800'}
  if(method==='eth_getBalance')return '0x58d15e176280000'
  if(method==='eth_getTransactionCount')return '0x0'
  if(method==='eth_getCode')return params[0]===expected.collection?nft:'0x'
  if(method==='eth_estimateGas')return '0x170d49'
  if(method==='eth_call')return runtime
  throw Error('Forbidden fixture method '+method)
 };return{readRpc,calls}
}
test('both independent RPCs simulate exact creation and agree on all required fields',async()=>{
 const{readRpc,calls}=fixture();const result=await freshPreflight(candidate,{readRpc});assert.equal(result.bothCreationSimulationsMatch,true);assert.equal(result.independentMatches,true)
 assert.equal(calls.filter(c=>c.method==='eth_call').length,2);assert.equal(new Set(calls.filter(c=>c.method==='eth_call').map(c=>c.url)).size,2)
 assert.ok(calls.every(c=>!['eth_sendTransaction','eth_sendRawTransaction'].includes(c.method)))
})
test('collector fails closed on secondary simulation, chain, state, nonce, estimate and block disagreement',async()=>{
 for(const [method,value,qualifies]of [
 ['eth_call','0x60',()=>true],['eth_chainId','0x1',()=>true],['eth_getBalance','0x1',()=>true],['eth_getTransactionCount','0x1',()=>true],['eth_estimateGas','0x186a01',()=>true],['eth_getCode','0x60',p=>p[0]===expected.collection],['eth_getBlockByNumber',{hash:'different'},()=>true]]){
 const {readRpc}=fixture((url,m,p)=>url.includes('rpc3.')&&m===method&&qualifies(p)?value:undefined)
 await assert.rejects(()=>freshPreflight(candidate,{readRpc}))
 }
})
test('even agreeing providers cannot approve stale blocks, wrong runtime or insufficient reserve',async()=>{
 for(const [method,value]of [['eth_call','0x60'],['eth_getBalance','0x1'],['eth_estimateGas','0x186a01'],['eth_getTransactionCount','0x1'],['eth_getBlockByNumber',{number:'0x123',hash:'0x'+'ab'.repeat(32),timestamp:'0x1',baseFeePerGas:'0x174876e800'}]]){
 const {readRpc}=fixture((url,m)=>m===method?value:undefined);await assert.rejects(()=>freshPreflight(candidate,{readRpc}))
 }
})
