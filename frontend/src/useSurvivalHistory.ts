import {useCallback, useEffect, useRef, useState} from 'react'
import {usePublicClient} from 'wagmi'
import {activeChain, approvedGameAddress, deploymentStartBlock, contractMode, mainnetMode} from './contracts'
import {readSurvivalHistory, type HistoryResult} from './survivalHistory'

export function useSurvivalHistory(tokenId: bigint | undefined, enabled: boolean) {
  const client = usePublicClient({chainId: activeChain.id})
  const [result, setResult] = useState<{key: string; value: HistoryResult}>()
  const [loading, setLoading] = useState(false)
  const [revision, setRevision] = useState(0)
  const [cursor, setCursor] = useState<{key: string; block: bigint}>()
  const generation = useRef(0)
  const key = `${activeChain.id}:${approvedGameAddress}:${tokenId}`
  const refresh = useCallback(() => {
    ++generation.current
    setResult(undefined)
    setCursor(undefined)
    setRevision((current) => current + 1)
  }, [])
  useEffect(() => {
    const listener = () => refresh()
    window.addEventListener('chog-local-history-refresh', listener)
    return () => window.removeEventListener('chog-local-history-refresh', listener)
  }, [])
  useEffect(() => {
    const run = ++generation.current
    if (!contractMode || !enabled || tokenId === undefined || !client || approvedGameAddress === undefined || deploymentStartBlock === undefined) { setLoading(false); setResult(undefined); return }
    let disposed = false; setLoading(true)
    const endBlock = cursor?.key === key ? cursor.block : undefined
    void readSurvivalHistory(client, approvedGameAddress, tokenId, deploymentStartBlock, () => !disposed && run === generation.current, mainnetMode ? {finalized: true, maxChunks: 100, endBlock} : undefined).then((next) => {
      if (!disposed && run === generation.current) setResult(previous => ({key, value: endBlock !== undefined && previous?.key === key ? {...next, latestBlock: previous.value.latestBlock, records: [...next.records, ...previous.value.records]} : next}))
    }).catch((error) => { if (!disposed && run === generation.current) setResult({key, value: {records: [], complete: false, partial: false, error: error instanceof Error ? error.message : 'History unavailable', latestBlock: 0n}}) }).finally(() => { if (!disposed && run === generation.current) setLoading(false) })
    return () => { disposed = true }
  }, [client, enabled, tokenId, revision, key, cursor])
  const current = enabled && result?.key === key ? result.value : undefined
  const loadOlder = () => { if (!loading && current?.nextBlock !== undefined && !current.error) setCursor({key, block: current.nextBlock}) }
  return {result: current, loading, refresh, loadOlder}
}
