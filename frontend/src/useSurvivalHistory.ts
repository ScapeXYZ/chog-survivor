import {useCallback, useEffect, useRef, useState} from 'react'
import {usePublicClient} from 'wagmi'
import {activeChain, approvedGameAddress, localDeploymentStartBlock, localMode} from './contracts'
import {readSurvivalHistory, type HistoryResult} from './survivalHistory'

export function useSurvivalHistory(tokenId: bigint | undefined, enabled: boolean) {
  const client = usePublicClient({chainId: activeChain.id})
  const [result, setResult] = useState<{key: string; value: HistoryResult}>()
  const [loading, setLoading] = useState(false)
  const [revision, setRevision] = useState(0)
  const generation = useRef(0)
  const key = `${activeChain.id}:${approvedGameAddress}:${tokenId}`
  const refresh = useCallback(() => {
    ++generation.current
    setResult(undefined)
    setRevision((current) => current + 1)
  }, [])
  useEffect(() => {
    const listener = () => refresh()
    window.addEventListener('chog-local-history-refresh', listener)
    return () => window.removeEventListener('chog-local-history-refresh', listener)
  }, [])
  useEffect(() => {
    const run = ++generation.current
    if (!localMode || !enabled || tokenId === undefined || !client || approvedGameAddress === undefined || localDeploymentStartBlock === undefined) { setLoading(false); setResult(undefined); return }
    let disposed = false; setLoading(true)
    void readSurvivalHistory(client, approvedGameAddress, tokenId, localDeploymentStartBlock, () => !disposed && run === generation.current).then((next) => { if (!disposed && run === generation.current) setResult({key, value: next}) }).catch((error) => { if (!disposed && run === generation.current) setResult({key, value: {records: [], complete: false, partial: false, error: error instanceof Error ? error.message : 'History unavailable', latestBlock: 0n}}) }).finally(() => { if (!disposed && run === generation.current) setLoading(false) })
    return () => { disposed = true }
  }, [client, enabled, tokenId, revision, key])
  return {result: enabled && result?.key === key ? result.value : undefined, loading, refresh}
}
