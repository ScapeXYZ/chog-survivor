// Offline checks of the retained on-chain record and actual signed transaction identity.
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {keccak256,serializeTransaction,recoverTransactionAddress} from 'viem'
import {approvedArtifact} from './release-artifact.mjs'
const evidence=JSON.parse(await fs.readFile(new URL('../../docs/evidence/task7a/verification.json',import.meta.url))),build=await approvedArtifact()
for(const r of evidence.results){
 const t=r.tx
 const signed=serializeTransaction({type:'eip1559',chainId:t.chainId,nonce:t.nonce,gas:BigInt(t.gas),maxFeePerGas:BigInt(t.maxFeePerGas),maxPriorityFeePerGas:BigInt(t.maxPriorityFeePerGas),value:BigInt(t.value),data:t.input,accessList:t.accessList},{r:t.r,s:t.s,yParity:t.yParity})
 assert.equal(keccak256(signed),evidence.hash)
 assert.equal((await recoverTransactionAddress({serializedTransaction:signed})).toLowerCase(),evidence.sender.toLowerCase())
 assert.equal(t.input,build.artifact.bytecode.object);assert.equal(r.runtimeHash,build.runtimeCodeHash)
 assert.equal(r.unsignedMatchesPreparedCandidate,true)
 assert.equal(r.receipt.status,'success');assert.equal(r.receipt.blockNumber,'113947533');assert.equal(r.receipt.contractAddress.toLowerCase(),evidence.address.toLowerCase())
 assert.ok(BigInt(r.finalized.number)>=113947533n)
 assert.ok(BigInt(r.balanceWei)>=100000000000000000n)
 assert.ok(BigInt(r.actualFeeWei)<=200000000000000000n)
}
console.log(JSON.stringify({status:'PASS',offlineOnly:true,providers:evidence.results.length,signedTransactionHashReconstructed:true,senderRecoveredFromPublicSignature:true,preparedCandidateUnchanged:true,frozenRuntimeHash:build.runtimeCodeHash,noSigningOrBroadcast:true},null,2))
