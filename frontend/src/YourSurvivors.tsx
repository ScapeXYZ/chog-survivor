import {useEffect, useRef, useState} from 'react'
import {useAccount, usePublicClient} from 'wagmi'
import {activeChain, environmentReady} from './contracts'
import {discoverSurvivors, type DiscoveryResult} from './discoverSurvivors'

type Inventory = {key: string; status: 'loading' | 'error' | 'done'; result?: DiscoveryResult}

export function YourSurvivors({selectedToken, onSelectToken, automatic = false}: {selectedToken?: bigint; onSelectToken: (token: bigint) => void; automatic?: boolean}) {
  const {address, isConnected, chainId} = useAccount()
  const client = usePublicClient({chainId: activeChain.id})
  const key = `${isConnected}:${address}:${chainId}:${automatic ? 'inventory' : selectedToken}`
  const selection = useRef({selectedToken, onSelectToken});selection.current = {selectedToken, onSelectToken}
  const current = useRef(key)
  current.current = key
  const generation = useRef(0)
  const [inventory, setInventory] = useState<Inventory>()
  const enabled = environmentReady && isConnected && !!address && chainId === activeChain.id && !!client
  const visible = inventory?.key === key ? inventory : undefined
  useEffect(() => {
    ++generation.current
    setInventory(undefined)
    // One bounded discovery per wallet context; never infer ownership from connection.
    if (automatic && enabled) void discover()
    function invalidate() { ++generation.current; setInventory(undefined);if (automatic && enabled) void discover() }
    window.addEventListener('focus', invalidate)
    return () => { ++generation.current; window.removeEventListener('focus', invalidate) }
  }, [key, automatic, enabled, client])
  useEffect(() => {
    if (automatic || inventory?.status !== 'done') return
    const timer = setTimeout(() => { ++generation.current; setInventory(undefined) }, 30_000)
    return () => clearTimeout(timer)
  }, [inventory, automatic])

  async function discover() {
    if (!enabled || !address || !client) return
    const run = ++generation.current
    let timedOut = false
    const timer = automatic ? setTimeout(() => {if (run === generation.current && current.current === key) {timedOut = true;setInventory({key, status: 'error'})}}, 12_000) : undefined
    const active = () => !timedOut && run === generation.current && current.current === key
    setInventory({key, status: 'loading'})
    try {
      const result = await discoverSurvivors(client, address, active)
      if (active()) {setInventory({key, status: 'done', result});if (automatic && selection.current.selectedToken === undefined && result.tokens.length) selection.current.onSelectToken(result.tokens[0])}
    } catch { if (active()) setInventory({key, status: 'error'}) } finally {clearTimeout(timer)}
  }
  const result = visible?.result
  return <section className="your-survivors" aria-labelledby="your-survivors-title" aria-busy={visible?.status === 'loading'}>
    <h3 id="your-survivors-title">Your Survivors</h3>
    <p className="survivor-small" role="status" aria-live="polite">{
      !isConnected || !address ? 'Connect your wallet to discover its Chogs. No holdings are assumed.' :
      !environmentReady ? 'Local test configuration is incomplete or unsafe. Discovery is disabled.' : chainId !== activeChain.id ? `Discovery requires your wallet on ${activeChain.name} (${activeChain.id}). Manual lookup remains below.` :
      visible?.status === 'loading' ? automatic ? 'Finding your Chogs…' : 'Reading the collection and verifying each candidate’s owner…' :
      visible?.status === 'error' ? automatic ? 'Discovery unavailable: retry or check a token manually below.' : 'Discovery unavailable: RPC, gas limit or collection verification failed. Retry or check a token manually.' :
      result && automatic ? result.complete ? result.tokens.length ? `${result.tokens.length} ${result.tokens.length === 1 ? 'Chog' : 'Chogs'} found. Choose your survivor.` : 'No Chog Genesis NFTs found in this wallet. Try another account or check a token manually.' : `${result.tokens.length} verified Chogs shown. Use manual entry if one is missing.` :
      result ? result.complete ? result.tokens.length === 0 ? `No owned Chogs at finalized block ${result.block}. Refresh to check again.` :
        `${result.tokens.length} owned ${result.tokens.length === 1 ? 'Chog' : 'Chogs'} verified at finalized block ${result.block}.` :
        `Partial discovery: ${result.tokens.length} verified Chogs shown. This is not a complete inventory; retry or use manual lookup.` :
      'Find Chogs controlled by this wallet. Ownership is checked against the collection; discovery is read only.'
    }</p>
    {result && result.tokens.length > 0 && <ul aria-label="Verified owned survivors">{result.tokens.map(token => <li key={token.toString()}>
      <button type="button" onClick={() => onSelectToken(token)} aria-pressed={token === selectedToken}>CHOG #{token.toString()}</button>
    </li>)}</ul>}
    <button type="button" className="survivor-retry" onClick={() => void discover()} disabled={!enabled || visible?.status === 'loading'}>{visible?.status === 'loading' ? 'Finding Chogs…' : visible ? 'Retry discovery' : 'Find my Chogs'}</button>
    {result && <p className="survivor-small">{automatic ? 'Ownership is checked again before you play.' : 'Snapshot only. Selecting a Chog rechecks its current owner. Transfers can change these results; refresh before relying on them.'}</p>}
  </section>
}
