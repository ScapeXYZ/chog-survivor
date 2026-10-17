import {useEffect, useRef, useState} from 'react'
import {useReadContract} from 'wagmi'
import {activeChain, CHOG_GENESIS, localMode, nftMetadataAbi} from './contracts'
import {readMetadata, type SurvivorMetadata} from './nftMetadata'
import {survivorReadFreshness} from './useSurvivorIdentity'

export function useNftMetadata(tokenId: bigint | undefined, verified: boolean, scopeKey: string) {
  const tokenUri = useReadContract({address: CHOG_GENESIS, abi: nftMetadataAbi, functionName: 'tokenURI', args: tokenId === undefined ? undefined : [tokenId], chainId: activeChain.id, scopeKey, query: {...survivorReadFreshness, enabled: verified && tokenId !== undefined}})
  const key = `${scopeKey}:${tokenId}:${tokenUri.data}`
  const [result, setResult] = useState<{key: string; metadata?: SurvivorMetadata; error?: string}>()
  const generation = useRef(0)
  useEffect(() => {
    const run = ++generation.current
    if (!verified || !tokenUri.data || tokenUri.isError || tokenUri.isFetching || tokenUri.isLoading) return
    void readMetadata(tokenUri.data, localMode).then(metadata => {if (run === generation.current) setResult({key, metadata})}).catch(reason => {if (run === generation.current) setResult({key, error: reason instanceof Error ? reason.message : 'Metadata unavailable'})})
    return () => {++generation.current}
  }, [key, tokenUri.data, tokenUri.isError, tokenUri.isFetching, tokenUri.isLoading, verified])
  const current = verified && !tokenUri.isError && !tokenUri.isFetching && !tokenUri.isLoading && result?.key === key ? result : undefined
  return {tokenUri, metadata: current?.metadata, error: current?.error}
}
