// Offline field verification only: no network, private key or signing operation.
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
const require=createRequire(new URL('../../../frontend/package.json',import.meta.url))
const {parseTransaction,keccak256,fromRlp,toHex}=require('viem')
const t=JSON.parse(fs.readFileSync(new URL('unsigned-deployment-candidate.json',import.meta.url)))
const p=parseTransaction(t.unsignedSerialized)
for(const k of ['gas','maxFeePerGas','maxPriorityFeePerGas'])assert.equal(p[k],BigInt(t[k]))
// Viem may omit empty RLP quantities for zero fields; validate the raw list too.
assert.equal(p.value??0n,0n);assert.equal(p.nonce??0,0);assert.equal(p.chainId,143)
assert.equal(p.type,'eip1559');assert.equal(p.to,undefined);assert.equal(p.data,t.data)
assert.equal(p.r,undefined);assert.equal(p.s,undefined);assert.deepEqual(p.accessList??[],[])
const raw=fromRlp('0x'+t.unsignedSerialized.slice(4))
assert.deepEqual(raw,[toHex(143),'0x',toHex(2000000000n),toHex(125000000000n),toHex(1600000n),'0x','0x',t.data,[]])
assert.equal(keccak256(t.unsignedSerialized),t.signingPayloadKeccak256)
assert.equal(keccak256(t.data),t.creationHash)
assert.equal(t.from.toLowerCase(),'0x320edae253259053d53fed8eee6d9c0274a91e85')
assert.equal(t.signature,null);assert.equal(t.transactionHash,null);assert.equal(t.authorization,null)
console.log(JSON.stringify({status:'PASS',offlineOnly:true,unsignedRlpFields:raw.length,chainId:143,nonce:0,value:'0',gas:'1600000',maxFeePerGas:'125000000000',maxPriorityFeePerGas:'2000000000',creationHash:t.creationHash,signingPayloadKeccak256:t.signingPayloadKeccak256,signed:false},null,2))
