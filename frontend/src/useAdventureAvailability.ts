import {useCallback, useEffect, useRef, useState} from 'react'
import {getAddress, type Address, type PublicClient} from 'viem'
import {activeChain, approvedGameAddress, CHOG_GENESIS, gameReadAbi, nftAbi} from './contracts'
import {events} from './game-data'
import {previewMatchesSession, type ContractPreview} from './adventureSession'

type AvailabilityClient = Pick<PublicClient, 'getBlock' | 'getChainId' | 'readContract'>
export type AdventureAvailability = {blockNumber: bigint; day: bigint; eventId: number; preview?: ContractPreview}

// Day, encounter and daily eligibility come from one contract preview at one
// verified block. Character cache timing never determines permission to act.
export async function readAdventureAvailability(client: AvailabilityClient, tokenId: bigint, account: Address, minimumBlock = 0n, expectedOwner: Address = account): Promise<AdventureAvailability> {
  if (!approvedGameAddress) throw new Error('No approved game deployment')
  const [block, chainId] = await Promise.all([client.getBlock({blockTag: 'latest'}), client.getChainId()])
  if (chainId !== activeChain.id || block.number === null || block.number < minimumBlock) throw new Error('Chain or confirmed block is unavailable')
  const [binding, owner] = await Promise.all([
    client.readContract({address: approvedGameAddress, abi: gameReadAbi, functionName: 'CHOG_GENESIS', blockNumber: block.number}),
    client.readContract({address: CHOG_GENESIS, abi: nftAbi, functionName: 'ownerOf', args: [tokenId], blockNumber: block.number}),
  ])
  if (getAddress(binding) !== getAddress(CHOG_GENESIS) || getAddress(owner) !== getAddress(expectedOwner)) throw new Error('Game binding or current owner changed')
  const day = block.timestamp / 86_400n
  if (getAddress(owner) !== getAddress(account)) {
    const eventId = await client.readContract({address: approvedGameAddress, abi: gameReadAbi, functionName: 'eventFor', args: [tokenId, day], blockNumber: block.number})
    if (!Number.isInteger(eventId) || eventId < 1 || eventId > events.length) throw new Error('Invalid public encounter')
    return {blockNumber: block.number, day, eventId}
  }
  const preview = await client.readContract({address: approvedGameAddress, abi: gameReadAbi, functionName: 'preview', args: [tokenId, 1], blockNumber: block.number})
  if (preview.eventId < 1 || preview.eventId > events.length || !previewMatchesSession(preview, {epoch: 0, tokenId, address: account, day: block.timestamp / 86_400n, eventIndex: preview.eventId - 1, choiceIndex: 0, stage: 'preview'})) throw new Error('Contract eligibility preview does not match the verified block')
  return {blockNumber: block.number, day, eventId: preview.eventId, preview}
}

export function useAdventureAvailability({client, tokenId, account, contextKey, enabled, expectedOwner}: {client: AvailabilityClient | undefined; tokenId?: bigint; account?: Address; contextKey: string; enabled: boolean; expectedOwner?: Address}) {
  const [state, setState] = useState<{key: string; snapshot?: AdventureAvailability; loading: boolean; error?: string}>()
  const current = useRef({key: contextKey, enabled})
  current.current = {key: contextKey, enabled}
  const generation = useRef(0)
  const floor = useRef({key: contextKey, block: 0n})

  const refresh = useCallback(async (options: {minimumBlock?: bigint; invalidate?: boolean} = {}) => {
    if (!client || !enabled || tokenId === undefined || !account || current.current.key !== contextKey || !current.current.enabled) return false
    const run = ++generation.current
    if (floor.current.key !== contextKey) floor.current = {key: contextKey, block: 0n}
    if (options.minimumBlock !== undefined && options.minimumBlock > floor.current.block) floor.current.block = options.minimumBlock
    setState(previous => ({key: contextKey, snapshot: !options.invalidate && previous?.key === contextKey ? previous.snapshot : undefined, loading: true}))
    const active = () => current.current.key === contextKey && current.current.enabled && generation.current === run
    try {
      const snapshot = await readAdventureAvailability(client, tokenId, account, floor.current.block, expectedOwner)
      if (!active()) return false
      floor.current.block = snapshot.blockNumber
      setState({key: contextKey, snapshot, loading: false})
      return true
    } catch (error) {
      if (active()) setState({key: contextKey, loading: false, error: error instanceof Error ? error.message : 'Eligibility read failed'})
      return false
    }
  }, [client, enabled, tokenId, account, contextKey, expectedOwner])

  useEffect(() => {
    if (!enabled) return
    void refresh()
    const timer = window.setInterval(() => void refresh(), 15_000)
    const focus = () => { void refresh() }
    const visible = () => { if (document.visibilityState === 'visible') void refresh() }
    window.addEventListener('focus', focus)
    document.addEventListener('visibilitychange', visible)
    return () => { ++generation.current; window.clearInterval(timer); window.removeEventListener('focus', focus); document.removeEventListener('visibilitychange', visible) }
  }, [enabled, refresh])

  const scoped = enabled && state?.key === contextKey ? state : undefined
  return {snapshot: scoped?.snapshot, loading: scoped?.loading ?? enabled, error: scoped?.error, refresh}
}
