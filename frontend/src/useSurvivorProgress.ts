import {useReadContract} from 'wagmi'
import {activeChain, approvedGameAddress, CHOG_GENESIS, gameReadAbi} from './contracts'
import {titles} from './game-data'
import {useSurvivorIdentity, survivorReadFreshness as freshness} from './useSurvivorIdentity'
import {useVerifiedDeployment} from './useVerifiedDeployment'

// A malformed/partial response is unavailable, not a set of zero defaults.
export function completeCharacter(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  for (const field of ['xp','trust','scars','streak','unmarkedStreak','lastOutcomeId','eventMask']) if (!Number.isInteger(v[field]) || Number(v[field]) < 0) return false
  return typeof v.hasActed === 'boolean' && typeof v.lastActionDay === 'bigint' && typeof v.achievementMask === 'bigint' && v.lastActionDay >= 0n && v.achievementMask >= 0n && Number(v.trust) <= 100 && Number(v.scars) <= 100
}

export function useSurvivorProgress(selectedToken?: bigint) {
  const ownerIdentity = useSurvivorIdentity(selectedToken)
  const proof = useVerifiedDeployment(ownerIdentity.verified && approvedGameAddress !== undefined, ownerIdentity.scopeKey)
  const identity = !ownerIdentity.verified || proof.verified ? ownerIdentity : {...ownerIdentity, verified: false, controls: false, ownershipMessage: proof.error ? `Unavailable — ${proof.error}` : 'Verifying canonical mainnet runtime and NFT collection…'}
  const binding = useReadContract({address: approvedGameAddress, abi: gameReadAbi, functionName: 'CHOG_GENESIS', chainId: activeChain.id, blockNumber: proof.blockNumber, scopeKey: identity.scopeKey, query: {...freshness, enabled: identity.verified && proof.verified && approvedGameAddress !== undefined}})
  const bound = identity.verified && proof.verified && approvedGameAddress !== undefined && !binding.isFetching && !binding.isLoading && !binding.isError && binding.data?.toLowerCase() === CHOG_GENESIS.toLowerCase()
  const character = useReadContract({address: approvedGameAddress, abi: gameReadAbi, functionName: 'characterOf', args: selectedToken === undefined ? undefined : [selectedToken], chainId: activeChain.id, blockNumber: proof.blockNumber, scopeKey: identity.scopeKey, query: {...freshness, enabled: bound}})
  const title = useReadContract({address: approvedGameAddress, abi: gameReadAbi, functionName: 'titleOf', args: selectedToken === undefined ? undefined : [selectedToken], chainId: activeChain.id, blockNumber: proof.blockNumber, scopeKey: identity.scopeKey, query: {...freshness, enabled: bound}})
  const state = bound && !character.isFetching && !character.isLoading && !character.isError && completeCharacter(character.data) ? character.data : undefined
  const titleName = bound && !title.isFetching && !title.isLoading && !title.isError && title.data !== undefined ? titles[title.data] : undefined
  return {identity, proof, binding, bound, character, title, state, titleName}
}
