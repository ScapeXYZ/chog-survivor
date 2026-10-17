import {decodeFunctionResult, encodeFunctionData, keccak256, parseAbi, type Address, type Hex, type PublicClient} from 'viem'
import {activeChain, CHOG_GENESIS, localMode, nftAbi} from './contracts'

// Independently observed collection extension, NOT ERC-721 Enumerable.
// Completeness is established by unique ownerOf checks AND balanceOf, not by trusting this getter.
const discoveryAbi = parseAbi(['function tokensOfOwner(address) view returns (uint256[])', 'function balanceOf(address) view returns (uint256)'])
export const verifiedCollectionCodeHash = '0x91aa1fd28371674abeb31670fd694cacaca57ac29cae579452c5150eb5dbab46'
export const discoveryLimit = 24
export type DiscoveryClient = Pick<PublicClient, 'getChainId' | 'getBlock' | 'getBytecode' | 'call'>
export type DiscoveryResult = {tokens: bigint[]; complete: boolean; balance: bigint; block: bigint}

export async function discoverSurvivors(client: DiscoveryClient, account: Address, active: () => boolean): Promise<DiscoveryResult> {
  // Bound call duration as well as candidate count. Late responses never start further reads.
  async function read<T>(request: () => Promise<T>): Promise<T> {
    if (!active()) throw new Error('Discovery superseded')
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      const result = await Promise.race([request(), new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Discovery read timed out')), 20_000)
      })])
      if (!active()) throw new Error('Discovery superseded')
      return result
    } finally { clearTimeout(timer) }
  }
  if (await read(() => client.getChainId()) !== activeChain.id) throw new Error('RPC network mismatch')
  // Anvil reports its genesis block as `finalized`; a local snapshot must use
  // the latest mined block. Production discovery remains finalized.
  const header = await read(() => client.getBlock({blockTag: localMode ? 'latest' : 'finalized'}))
  const block = header.number
  if (block === null || !header.hash) throw new Error('Finalized block unavailable')
  const code = await read(() => client.getBytecode({address: CHOG_GENESIS, blockNumber: block}))
  if (!code || (!localMode && keccak256(code) !== verifiedCollectionCodeHash)) throw new Error('Collection code differs from verified discovery evidence')
  // Installed viem readContract does not forward a gas budget; use explicit eth_call.
  async function call(data: Hex, gas: bigint) {
    const response = await read(() => client.call({to: CHOG_GENESIS, data, gas, blockNumber: block}))
    if (!response.data) throw new Error('Empty collection response')
    return response.data
  }
  const balance = decodeFunctionResult({abi: discoveryAbi, functionName: 'balanceOf', data: await call(encodeFunctionData({abi: discoveryAbi, functionName: 'balanceOf', args: [account]}), 100_000n)})
  // The local fixture is tiny and Anvil's default block gas limit is below the
  // conservative production discovery budget.
  const discoveryGas = localMode ? 5_000_000n : 50_000_000n
  const candidates = decodeFunctionResult({abi: discoveryAbi, functionName: 'tokensOfOwner', data: await call(encodeFunctionData({abi: discoveryAbi, functionName: 'tokensOfOwner', args: [account]}), discoveryGas)})
  const unique = [...new Set(candidates)]
  const tokens: bigint[] = []
  let complete = unique.length === candidates.length && BigInt(unique.length) === balance && unique.length <= discoveryLimit
  // Four concurrent bounded owner reads keep larger inventories responsive.
  const bounded = unique.slice(0, discoveryLimit)
  for (let offset = 0; offset < bounded.length; offset += 4) {
    const checked = await Promise.all(bounded.slice(offset, offset + 4).map(async token => {
      try {
        const owner = decodeFunctionResult({abi: nftAbi, functionName: 'ownerOf', data: await call(encodeFunctionData({abi: nftAbi, functionName: 'ownerOf', args: [token]}), 1_000_000n)})
        return owner.toLowerCase() === account.toLowerCase() ? token : undefined
      } catch {if (!active()) throw new Error('Discovery superseded');return undefined}
    }))
    for (const token of checked) {if (token !== undefined) tokens.push(token);else complete = false}
  }
  const confirmedHeader = await read(() => client.getBlock({blockNumber: block}))
  if (confirmedHeader.hash !== header.hash) throw new Error('Discovery block changed')
  complete = complete && BigInt(tokens.length) === balance
  return {tokens, complete, balance, block}
}
