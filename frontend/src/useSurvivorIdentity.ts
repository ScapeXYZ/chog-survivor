import {useAccount, useReadContract} from 'wagmi'
import {toFunctionSelector, zeroAddress} from 'viem'
import {CHOG_GENESIS, monad, nftAbi} from './contracts'

// An ambiguous ownerOf revert does not establish that an NFT is nonexistent.
function ownershipFailure(error: unknown): 'nonexistent' | 'reverted' | 'rpc' {
  const seen = new Set<unknown>()
  let reverted = false
  while (error && typeof error === 'object' && !seen.has(error)) {
    seen.add(error)
    const item = error as {name?: string; data?: {errorName?: string} | string; raw?: string; cause?: unknown}
    if ((typeof item.data === 'object' && item.data?.errorName === 'ERC721NonexistentToken') ||
      (item.raw ?? (typeof item.data === 'string' ? item.data : ''))?.startsWith(toFunctionSelector('ERC721NonexistentToken(uint256)'))) return 'nonexistent'
    if (item.name === 'ContractFunctionRevertedError') reverted = true
    error = item.cause
  }
  return reverted ? 'reverted' : 'rpc'
}

export const survivorReadFreshness = {staleTime: 0, refetchOnMount: 'always' as const,
  refetchOnWindowFocus: true, refetchInterval: 30_000}

// Both screens use App's requested token and the same account/network-scoped query.
// A requested ID is never a verified identity while ownership is pending or unavailable.
export function useSurvivorIdentity(selectedToken?: bigint) {
  const {address, isConnected, chainId} = useAccount()
  const connected = isConnected && address !== undefined
  const onMonad = chainId === monad.id
  const enabled = connected && onMonad && selectedToken !== undefined
  const scopeKey = `survivor:${address ?? 'disconnected'}:${chainId}`
  const contextKey = `${scopeKey}:${selectedToken}`
  const owner = useReadContract({address: CHOG_GENESIS, abi: nftAbi, functionName: 'ownerOf',
    args: selectedToken === undefined ? undefined : [selectedToken], chainId: monad.id, scopeKey,
    query: {...survivorReadFreshness, enabled}})
  const checkingOwner = enabled && (owner.isFetching || owner.isLoading)
  const verified = enabled && !checkingOwner && !owner.isError && owner.data !== undefined && owner.data !== zeroAddress
  const controls = verified && owner.data?.toLowerCase() === address?.toLowerCase()

  let ownershipMessage = 'Enter a Chog Genesis token ID to look up its survivor.'
  if (!connected) ownershipMessage = 'Wallet disconnected. Connect your wallet to verify the current controller.'
  else if (chainId === undefined) ownershipMessage = 'Wallet network unavailable. Reconnect your wallet to verify its chain before ownership reads.'
  else if (!onMonad) ownershipMessage = 'Wrong network. Select Monad (chain ID 143) in your wallet to verify ownership.'
  else if (checkingOwner) ownershipMessage = 'Checking canonical ownerOf… Identity is not yet verified.'
  else if (enabled && owner.isError) {
    const failure = ownershipFailure(owner.error)
    ownershipMessage = failure === 'nonexistent' ? 'NFT nonexistent: the collection reports that this token ID does not exist. It may have been burned.' :
      failure === 'reverted' ? 'NFT unavailable: ownerOf reverted. Nonexistence, burn or collection restrictions cannot be distinguished from this response.' :
      'RPC failure. Current ownership could not be verified. Retry the read.'
  } else if (verified) ownershipMessage = controls ? 'You control this survivor. Your connected wallet is its current owner.' : 'Another wallet controls this survivor. You can inspect its read-only profile.'
  else if (enabled && owner.data === zeroAddress) ownershipMessage = 'NFT unavailable: the collection returned a zero owner. No current controller is verified.'
  else if (enabled) ownershipMessage = 'Ownership verification is pending. No survivor identity is confirmed.'

  return {owner, address, connected, onMonad, enabled, scopeKey, contextKey, checkingOwner, verified, controls, ownershipMessage}
}
