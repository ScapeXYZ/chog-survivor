import {useEffect, useRef, useState} from 'react'
import {useReadContract} from 'wagmi'
import {activeChain, CHOG_GENESIS, localMode, nftMetadataAbi} from './contracts'
import {readMetadata, type SurvivorMetadata} from './nftMetadata'
import {survivorReadFreshness} from './useSurvivorIdentity'

export function useNftMetadata(tokenId: bigint | undefined, verified: boolean, scopeKey: string) {
  const tokenUri = useReadContract({address: CHOG_GENESIS, abi: nftMetadataAbi, functionName: 'tokenURI', args: tokenId === undefined ? undefined : [tokenId], chainId: activeChain.id, scopeKey, query: {...survivorReadFreshness, enabled: verified && tokenId !== undefined}})
  const [metadata, setMetadata] = useState<SurvivorMetadata>(); const [error, setError] = useState<string>(); const generation = useRef(0)
  useEffect(() => { const run = ++generation.current; setMetadata(undefined); setError(undefined); if (!tokenUri.data || tokenUri.isError) return; void readMetadata(tokenUri.data, localMode).then(value => { if (run === generation.current) setMetadata(value) }).catch(reason => { if (run === generation.current) setError(reason instanceof Error ? reason.message : 'Metadata unavailable') }) }, [tokenUri.data, tokenUri.isError, tokenId, scopeKey])
  return {tokenUri, metadata, error}
}
