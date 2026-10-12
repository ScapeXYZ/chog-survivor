import {useEffect, useRef, useState} from 'react'
import {useAccount, usePublicClient} from 'wagmi'
import {monad} from './contracts'
import {discoverSurvivors, type DiscoveryResult} from './discoverSurvivors'

type Inventory = {key: string; status: 'loading' | 'error' | 'done'; result?: DiscoveryResult}

export function YourSurvivors({selectedToken, onSelectToken}: {selectedToken?: bigint; onSelectToken: (token: bigint) => void}) {
  const {address, isConnected, chainId} = useAccount()
  const client = usePublicClient({chainId: monad.id})
  const key = `${isConnected}:${address}:${chainId}:${selectedToken}`
  const current = useRef(key)
  current.current = key
  const generation = useRef(0)
  const [inventory, setInventory] = useState<Inventory>()
  const enabled = isConnected && !!address && chainId === monad.id && !!client
  const visible = inventory?.key === key ? inventory : undefined
  useEffect(() => {
    ++generation.current
    setInventory(undefined)
    // Expensive collection-wide getter is explicit only; focus invalidates rather than polling it.
    function invalidate() { ++generation.current; setInventory(undefined) }
    window.addEventListener('focus', invalidate)
    return () => { ++generation.current; window.removeEventListener('focus', invalidate) }
  }, [key])
  useEffect(() => {
    if (inventory?.status !== 'done') return
    const timer = setTimeout(() => { ++generation.current; setInventory(undefined) }, 30_000)
    return () => clearTimeout(timer)
  }, [inventory])

  async function discover() {
    if (!enabled || !address || !client) return
    const run = ++generation.current
    const active = () => run === generation.current && current.current === key
    setInventory({key, status: 'loading'})
    try {
      const result = await discoverSurvivors(client, address, active)
      if (active()) setInventory({key, status: 'done', result})
    } catch { if (active()) setInventory({key, status: 'error'}) }
  }
  const result = visible?.result
  return <section className="your-survivors" aria-labelledby="your-survivors-title" aria-busy={visible?.status === 'loading'}>
    <h3 id="your-survivors-title">Your Survivors</h3>
    <p className="survivor-small" role="status" aria-live="polite">{
      !isConnected || !address ? 'Connect your wallet to discover its Chogs. No holdings are assumed.' :
      chainId !== monad.id ? 'Discovery requires your wallet on Monad (143). Manual lookup remains below.' :
      visible?.status === 'loading' ? 'Reading the collection and verifying each candidate’s owner…' :
      visible?.status === 'error' ? 'Discovery unavailable: RPC, gas limit or collection verification failed. Retry or check a token manually.' :
      result ? result.complete ? result.tokens.length === 0 ? `No owned Chogs at finalized block ${result.block}. Refresh to check again.` :
        `${result.tokens.length} owned ${result.tokens.length === 1 ? 'Chog' : 'Chogs'} verified at finalized block ${result.block}.` :
        `Partial discovery: ${result.tokens.length} verified Chogs shown. This is not a complete inventory; retry or use manual lookup.` :
      'Find Chogs controlled by this wallet. Ownership is checked against the collection; discovery is read only.'
    }</p>
    {result && result.tokens.length > 0 && <ul aria-label="Verified owned survivors">{result.tokens.map(token => <li key={token.toString()}>
      <button type="button" onClick={() => onSelectToken(token)} aria-pressed={token === selectedToken}>CHOG #{token.toString()}</button>
    </li>)}</ul>}
    <button type="button" className="survivor-retry" onClick={() => void discover()} disabled={!enabled || visible?.status === 'loading'}>{visible?.status === 'loading' ? 'Finding Chogs…' : visible ? 'Retry discovery' : 'Find my Chogs'}</button>
    {result && <p className="survivor-small">Snapshot only. Selecting a Chog rechecks its current owner. Transfers can change these results; refresh before relying on them.</p>}
  </section>
}
