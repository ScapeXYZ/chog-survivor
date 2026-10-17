import {useEffect, useRef, useState} from 'react'
import {usePublicClient} from 'wagmi'
import {keccak256} from 'viem'
import {activeChain, approvedGameAddress, CHOG_GENESIS, gameReadAbi, localMode} from './contracts'
import {mainnetDeployment} from './mainnetDeployment'
import {verifiedCollectionCodeHash} from './discoverSurvivors'

// Verify a finalized snapshot before displaying game data. No wallet/signing methods.
export function useVerifiedDeployment(enabled: boolean, contextKey: string) {
  const client = usePublicClient({chainId: activeChain.id})
  const [proof, setProof] = useState<{key: string; blockNumber?: bigint; verified: boolean; error?: string}>()
  const generation = useRef(0)
  useEffect(() => {
    let disposed = false
    async function refresh() {
      const run = ++generation.current
      setProof(undefined)
      if (!enabled || localMode) return
      try {
        if (!client || !approvedGameAddress || !mainnetDeployment) throw Error('Game verification unavailable')
        if (await client.getChainId() !== 143) throw Error('RPC network mismatch')
        const block = await client.getBlock({blockTag: 'finalized'})
        if (block.number === null || !block.hash) throw Error('Finalized block unavailable')
        const [gameCode, nftCode, binding] = await Promise.all([
          client.getCode({address: approvedGameAddress, blockNumber: block.number}),
          client.getCode({address: CHOG_GENESIS, blockNumber: block.number}),
          client.readContract({address: approvedGameAddress, abi: gameReadAbi, functionName: 'CHOG_GENESIS', blockNumber: block.number}),
        ])
        if (!gameCode || keccak256(gameCode) !== mainnetDeployment.runtimeCodeHash || !nftCode || keccak256(nftCode) !== verifiedCollectionCodeHash || binding.toLowerCase() !== CHOG_GENESIS.toLowerCase()) throw Error('Game runtime or collection binding mismatch')
        if ((await client.getBlock({blockNumber: block.number})).hash !== block.hash) throw Error('Finalized block changed')
        if (!disposed && generation.current === run) setProof({key: contextKey, blockNumber: block.number, verified: true})
      } catch (error) {
        if (!disposed && generation.current === run) setProof({key: contextKey, verified: false, error: error instanceof Error ? error.message : 'Game verification unavailable'})
      }
    }
    void refresh()
    const timer = enabled && !localMode ? window.setInterval(() => void refresh(), 30_000) : undefined
    const focus = () => { void refresh() }
    window.addEventListener('focus', focus)
    return () => { disposed = true; ++generation.current; clearInterval(timer); window.removeEventListener('focus', focus) }
  }, [client, enabled, contextKey])
  if (localMode) return {verified: enabled, blockNumber: undefined, error: undefined, loading: false}
  const current = enabled && proof?.key === contextKey ? proof : undefined
  return {verified: current?.verified === true, blockNumber: current?.blockNumber, error: current?.error, loading: enabled && !current}
}
