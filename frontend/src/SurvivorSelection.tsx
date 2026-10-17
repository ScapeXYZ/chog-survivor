import {useState} from 'react'
import {useAccount} from 'wagmi'
import {YourSurvivors} from './YourSurvivors'
import {parseTokenId} from './utils'
import './survivor-selection.css'

export function SurvivorSelection({selectedToken, onSelectToken, onConnect}: {selectedToken?: bigint; onSelectToken: (token: bigint) => void; onConnect: () => void}) {
  const {isConnected} = useAccount()
  const [entry, setEntry] = useState('')
  const token = parseTokenId(entry)
  return <section className="survivor-selection" aria-label="Choose your survivor">
    <div><p className="survivor-eyebrow">YOUR ADVENTURE PARTY</p><h2>Choose your Chog</h2><p>Your NFT carries its progress. Choose a survivor to enter today’s encounter.</p></div>
    {!isConnected && <button className="primary" onClick={onConnect}>Connect wallet to find your Chogs</button>}
    <YourSurvivors automatic selectedToken={selectedToken} onSelectToken={onSelectToken}/>
    <details className="manual-survivor"><summary>Enter a Chog Genesis token ID</summary>
      <p>Discovery unavailable or missing a Chog? Enter its token ID. Current ownership is checked before play.</p>
      <form onSubmit={event => {event.preventDefault();if(token !== undefined) onSelectToken(token)}}><label htmlFor="survivor-fallback-id">Survivor token ID</label><div className="survivor-entry"><input id="survivor-fallback-id" inputMode="numeric" autoComplete="off" value={entry} onChange={event => setEntry(event.target.value)}/><button disabled={token === undefined}>Select survivor</button></div></form>
    </details>
  </section>
}
