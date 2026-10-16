// Read-only checks. Optional argument is a PUBLIC deployment address only.
import fs from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {createPublicClient, http, isAddress, keccak256, parseAbi, getContractAddress} from 'viem'
import {approvedArtifact, collection} from './release-artifact.mjs'
const sender = process.argv[2]
if (process.argv.length > 3 || (sender && !isAddress(sender))) throw Error('Optional argument must be a public deployer address')
const build = await approvedArtifact()
const client = createPublicClient({transport: http('https://rpc.monad.xyz', {timeout: 20000})})
const chainId = await client.getChainId()
if (chainId !== 143) throw Error('Wrong chain')
const block = await client.getBlock({blockTag: 'finalized'})
const code = await client.getCode({address: collection, blockNumber: block.number})
if (!code || keccak256(code) !== '0x91aa1fd28371674abeb31670fd694cacaca57ac29cae579452c5150eb5dbab46') throw Error('Collection runtime changed')
const e = {capturedAt: new Date().toISOString(), chainId, rpc: 'https://rpc.monad.xyz', block: {number: block.number, hash: block.hash}, collection, collectionRuntimeCodeHash: keccak256(code), creationHash: build.creationHash, expectedGameRuntimeHash: build.runtimeCodeHash, reads: {}, deployer: sender ?? null}
const abi = parseAbi(['function name() view returns (string)', 'function symbol() view returns (string)', 'function ownerOf(uint256) view returns (address)', 'function supportsInterface(bytes4) view returns (bool)'])
for (const [name, args] of [['name', []], ['symbol', []], ['ownerOf', [1425n]], ['supportsInterface', ['0x80ac58cd']]]) e.reads[name] = await client.readContract({address: collection, abi, functionName: name, args, blockNumber: block.number})
e.gasPrice = await client.getGasPrice()
const estimateSender = sender ?? '0x000000000000000000000000000000000000bEEF'
e.estimateSender = estimateSender; e.estimateSenderApproved = sender?.toLowerCase() === '0x320edae253259053d53fed8eee6d9c0274a91e85'
try { e.deploymentGasEstimate = await client.estimateGas({account: estimateSender, data: build.artifact.bytecode.object}); e.estimatedFeeWei = e.deploymentGasEstimate * e.gasPrice } catch (error) { e.estimateError = error.shortMessage ?? error.message }
if (sender) {
  e.balanceWei = await client.getBalance({address: sender})
  e.accountCode = await client.getCode({address: sender}) ?? '0x'
  e.reserveWei = 100000000000000000n
  e.balanceCoversEstimateAndReserve = e.estimatedFeeWei !== undefined && e.balanceWei >= e.estimatedFeeWei + e.reserveWei
  e.latestNonce = await client.getTransactionCount({address: sender, blockTag: 'latest'})
  e.pendingNonce = await client.getTransactionCount({address: sender, blockTag: 'pending'})
  e.expectedCreateAddress = getContractAddress({from: sender, nonce: BigInt(e.pendingNonce)})
  e.nonceReady = e.latestNonce === e.pendingNonce
}
const url = 'https://raw.githubusercontent.com/MetaMask/eth-phishing-detect/main/src/config.json'
const response = await fetch(url); if (!response.ok) throw Error(`Warning config HTTP ${response.status}`)
const text = await response.text(), config = JSON.parse(text), domain = 'chog-survivor.vercel.app'
e.warningPublicList = {url, sha256: createHash('sha256').update(text).digest('hex'), matches: config.blacklist.filter(item => domain === item || domain.endsWith('.'+item)), limitation: 'Exact/parent blacklist only; no fuzzy/proprietary verdict or provider clearance'}
const json = JSON.stringify(e, (_, value) => typeof value === 'bigint' ? value.toString() : value, 2)+'\n'
// Exclusive create preserves previous captures. Choose a new filename for a repeat.
await fs.writeFile(new URL('../../docs/evidence/task6b/approved-deployer-readonly.json', import.meta.url), json, {flag: 'wx'})
console.log(json)
