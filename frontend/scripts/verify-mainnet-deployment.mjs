// Read-only post-deployment verifier. Prints a CANDIDATE; never activates the app.
import {createPublicClient, http, isAddress, zeroAddress, getContractAddress, parseAbi, keccak256} from 'viem'
import {approvedArtifact, collection} from './release-artifact.mjs'
const [address, hash, sender] = process.argv.slice(2)
if (process.argv.length !== 5 || !isAddress(address) || !isAddress(sender) || address.toLowerCase() === collection.toLowerCase() || address === zeroAddress || !/^0x[\da-fA-F]{64}$/.test(hash)) throw Error('Usage: node scripts/verify-mainnet-deployment.mjs GAME_ADDRESS DEPLOYMENT_TX_HASH APPROVED_PUBLIC_DEPLOYER')
const build = await approvedArtifact()
const client = createPublicClient({transport: http('https://rpc.monad.xyz')})
if (await client.getChainId() !== 143) throw Error('Wrong chain')
const [tx, receipt, finalized] = await Promise.all([client.getTransaction({hash}), client.getTransactionReceipt({hash}), client.getBlock({blockTag: 'finalized'})])
if (tx.chainId !== 143 || tx.from.toLowerCase() !== sender.toLowerCase() || tx.to !== null || tx.value !== 0n || tx.input.toLowerCase() !== build.artifact.bytecode.object.toLowerCase() || receipt.status !== 'success' || receipt.contractAddress?.toLowerCase() !== address.toLowerCase() || getContractAddress({from: tx.from, nonce: BigInt(tx.nonce)}).toLowerCase() !== address.toLowerCase() || finalized.number === null || finalized.number < receipt.blockNumber) throw Error('Deployment transaction/receipt mismatch or not finalized')
const block = await client.getBlock({blockNumber: receipt.blockNumber})
if (block.hash !== receipt.blockHash || tx.blockHash !== receipt.blockHash) throw Error('Noncanonical receipt')
for (const blockNumber of [receipt.blockNumber, finalized.number]) {
  const code = await client.getCode({address, blockNumber})
  if (!code || code.toLowerCase() !== build.runtime.toLowerCase() || keccak256(code) !== build.runtimeCodeHash) throw Error('Full runtime mismatch')
  const binding = await client.readContract({address, abi: parseAbi(['function CHOG_GENESIS() view returns (address)']), functionName: 'CHOG_GENESIS', blockNumber})
  if (binding.toLowerCase() !== collection.toLowerCase()) throw Error('NFT binding mismatch')
}
console.log(JSON.stringify({status: 'CANDIDATE — independent RPC, explorer source verification and owner release approval still required', chainId: 143, address, deploymentBlock: receipt.blockNumber.toString(), runtimeCodeHash: build.runtimeCodeHash, transactionHash: hash, sender: tx.from, nonce: tx.nonce, blockHash: receipt.blockHash, sourceHash: build.sourceHash, creationHash: build.creationHash}, null, 2))
