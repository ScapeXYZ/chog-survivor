// Read-only evidence; no signing or broadcast methods.
import fs from 'node:fs/promises'
import {createPublicClient, http, keccak256, parseAbi} from 'viem'
const rpc = 'https://rpc.monad.xyz'
const client = createPublicClient({transport: http(rpc, {timeout: 20000})})
const address = '0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763'
const abi = parseAbi(['function name() view returns (string)', 'function symbol() view returns (string)', 'function totalSupply() view returns (uint256)', 'function ownerOf(uint256) view returns (address)', 'function supportsInterface(bytes4) view returns (bool)'])
const block = await client.getBlock({blockTag: 'finalized'})
const e = {capturedAt: new Date().toISOString(), rpc, chainId: await client.getChainId(), block: {number: block.number, hash: block.hash, timestamp: block.timestamp}, address, reads: {}}
if (e.chainId !== 143) throw Error('Wrong chain')
const code = await client.getCode({address, blockNumber: block.number})
e.runtimeBytes = (code.length - 2) / 2; e.runtimeKeccak256 = keccak256(code)
for (const [key, functionName, args] of [['name','name'],['symbol','symbol'],['totalSupply','totalSupply'],['erc721','supportsInterface',['0x80ac58cd']],['owner1425','ownerOf',[1425n]],['nonexistent','ownerOf',[(1n << 256n)-1n]]]) {
  try { e.reads[key] = {result: await client.readContract({address, abi, functionName, args, blockNumber: block.number})} }
  catch (error) { e.reads[key] = {error: error.shortMessage ?? error.message} }
}
for (const [key, slot] of Object.entries({implementation:'0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc',admin:'0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103',beacon:'0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50'})) e.reads[key] = await client.getStorageAt({address, slot, blockNumber: block.number})
e.gasPrice = await client.getGasPrice()
const artifact = JSON.parse(await fs.readFile('../out/ChogSurvivor.sol/ChogSurvivor.json','utf8'))
e.creationBytecodeKeccak256 = keccak256(artifact.bytecode.object)
e.deploymentEstimateSender = e.reads.owner1425.result
try { e.deploymentGasEstimate = await client.estimateGas({account: e.deploymentEstimateSender, data: artifact.bytecode.object}); e.estimatedFeeWei = e.deploymentGasEstimate * e.gasPrice } catch (error) { e.estimateError = error.shortMessage ?? error.message }
await fs.mkdir('../docs/evidence/task6a', {recursive: true})
const json = JSON.stringify(e, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2)+'\n'
await fs.writeFile('../docs/evidence/task6a/monad-readonly.json', json)
console.log(json)
