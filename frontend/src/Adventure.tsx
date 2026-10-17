import {usePublicClient} from 'wagmi'
import {activeChain, localMode, mainnetTransactionsEnabled} from './contracts'
import {LocalContractAdventure} from './LocalContractAdventure'
import {useSurvivorProgress} from './useSurvivorProgress'
import {useAdventureAvailability} from './useAdventureAvailability'
import {events, achievements} from './game-data'
import {shortAddress} from './utils'
import {NewOwnerNotice, type AdventureNavigation} from './NewOwnerNotice'
import wildEnvironment from './assets/ruined-wild-environment-provisional.webp'
import fogOverlay from './assets/moonlit-fog-overlay-provisional.webp'
import './adventure.css'
import {MainnetGameplayPanel} from './MainnetGameplayPanel'

function MainnetReadAdventure({selectedToken, onHome, onCharacter, onFindChogs, onHistory}: {selectedToken?: bigint; onHome: () => void} & AdventureNavigation) {
  const {identity, proof, bound, character, state, titleName} = useSurvivorProgress(selectedToken)
  const client = usePublicClient({chainId: activeChain.id})
  const availability = useAdventureAvailability({client, tokenId: selectedToken, account: identity.address, expectedOwner: identity.owner.data, contextKey: identity.contextKey, enabled: bound && identity.controls})
  const eventId = bound && !availability.loading && !availability.error ? availability.snapshot?.eventId : undefined
  const event = eventId === undefined ? undefined : events[eventId - 1]
  const nonOwner = identity.verified && !identity.controls
  const message = !identity.verified ? identity.ownershipMessage : proof.error ? `Unavailable — ${proof.error}` : proof.loading ? 'Verifying mainnet runtime and collection binding…' : character.isError ? 'RPC failure. Survivor state is unavailable; no fallback values are shown.' : !bound || !state ? 'Survivor state unavailable. Waiting for verified contract reads.' : `Recorded state from Monad mainnet${proof.blockNumber === undefined ? '' : ` at finalized block ${proof.blockNumber}`}.`
  return <section className="adventure-game" aria-labelledby="adventure-title">
    <header className="adventure-hud"><div className="adventure-brand"><span className="adventure-emblem">CS</span><div><strong>CHOG SURVIVOR</strong><span className="adventure-demo-badge">{mainnetTransactionsEnabled ? 'MONAD MAINNET · REAL TRANSACTIONS' : 'MONAD MAINNET · READ ONLY'}</span></div></div>
      <div className="adventure-stat-group"><span className="adventure-stat-disclosure">VERIFIED CONTRACT RECORDS ONLY</span><dl className="adventure-stats" aria-label="Recorded survivor statistics">{(['XP','Trust','Scars','Streak'] as const).map(label => {const value = state?.[label.toLowerCase() as 'xp'|'trust'|'scars'|'streak']; return <div key={label}><dt>{label}</dt><dd className={value === undefined ? 'read-unavailable' : ''}>{value ?? 'Unavailable'}</dd></div>})}</dl></div>
      <button className="adventure-home" onClick={onHome}>← Back to Home</button>
    </header>
    <aside className="adventure-survivor" aria-label="Adventure survivor identity">
      {nonOwner ? <NewOwnerNotice tokenId={selectedToken!} onFindChogs={onFindChogs} onHistory={onHistory ?? onCharacter}/> : <div role="status" aria-live="polite"><span className="adventure-survivor-label">{identity.verified ? 'VERIFIED NFT IDENTITY' : 'NO VERIFIED SURVIVOR'}</span><strong>{identity.verified ? `CHOG #${selectedToken}` : 'No verified Chog selected'}</strong>{selectedToken !== undefined && !identity.verified && <small>Requested token #{selectedToken.toString()} · unverified</small>}{identity.verified && <p>{identity.ownershipMessage}</p>}<p>{message}</p>{identity.verified && <p>Verified owner: {shortAddress(identity.owner.data)} · {identity.controls ? 'your wallet' : 'another wallet'}.</p>}</div>}
      <p className="adventure-survivor-disclosure">{mainnetTransactionsEnabled ? 'Review each real action and MON gas cost before requesting wallet confirmation. Outcomes require verified receipts and state.' : 'On-chain gameplay not yet enabled. No simulated progression, earned marks or transaction results are displayed.'}</p>
      <div className="adventure-survivor-actions"><button type="button" onClick={onCharacter}>View survivor profile →</button>{selectedToken !== undefined && <button type="button" disabled={!identity.enabled || identity.checkingOwner} onClick={() => void identity.owner.refetch()}>Refresh ownership</button>}</div>
    </aside>
    <div className="adventure-stage"><div className="adventure-world" role="img" aria-label="Decorative moonlit forest — not NFT artwork or a generated gameplay outcome"><img className="adventure-environment" src={wildEnvironment} alt=""/><div className="adventure-scene-wash"/><img className="adventure-mist adventure-mist-back" src={fogOverlay} alt=""/><img className="adventure-mist" src={fogOverlay} alt=""/><div className="adventure-canopy"><i/><i/></div><div className="adventure-stone adventure-stone-left"><i/><i/><i/></div><div className="adventure-stone adventure-stone-right"><i/><i/></div><div className="adventure-lantern adventure-lantern-left"><i/></div><div className="adventure-world-edge"/></div>
      <div className="adventure-scene-heading"><div><p className="adventure-eyebrow">{event ? `CHAIN-VERIFIED ENCOUNTER · ${eventId} / 6` : 'AWAITING VERIFIED CHAIN DATA'}</p><h1 id="adventure-title">{event?.name ?? 'The Ruined Wild'}</h1><p className="adventure-scene-motto">{event ? event.narrative : 'Choose a genuine Chog to inspect its recorded story.'}</p></div></div>
      <div className="adventure-trail-tag"><span className="adventure-eyebrow">RECORDED SURVIVOR TITLE</span><strong>{titleName ?? 'Unavailable'}</strong><span>{identity.verified ? `Token ${selectedToken}` : 'No verified token selected'}</span></div><span className="adventure-scene-caption">THE RUINED WILD · DECORATIVE SETTING</span></div>
    {!mainnetTransactionsEnabled && <section className="adventure-controls"><div className="adventure-story"><div><p className="adventure-eyebrow">YOUR NEXT MOVE</p><h2>On-chain gameplay not yet enabled</h2></div><p>{availability.error ? 'Chain-day eligibility unavailable. RPC errors never generate an encounter.' : event ? 'These choices belong to the encounter read from the contract. Transactions remain disabled.' : 'No encounter is generated from your device clock or a sample token.'}</p></div>
      {!mainnetTransactionsEnabled && event && <div className="adventure-choices" aria-label="Verified encounter choices">{event.choices.map((choice,index) => <button disabled key={choice} className={`adventure-choice adventure-choice-${event.tags[index]}`}><span className="adventure-choice-category">{event.tags[index]}</span><strong>{choice}</strong><span className="adventure-choice-action">Transactions disabled</span></button>)}</div>}
      <div className="adventure-demo-footer"><span>{bound && availability.snapshot?.preview ? availability.snapshot.preview.canAct ? 'Contract reports this token is eligible for the current chain day; submission remains disabled.' : 'Contract reports the current UTC daily lock. Transfers do not reset it.' : 'Daily availability: Unavailable'}</span><button disabled className="adventure-chain-action">On-chain gameplay not yet enabled</button></div>
    </section>}
    {mainnetTransactionsEnabled && <MainnetGameplayPanel selectedToken={selectedToken}/>}
    <details className="adventure-chronicle"><summary>Recorded achievements</summary>{state ? <ul>{achievements.map((name,index)=><li key={name}>{(state.achievementMask & (1n << BigInt(index))) !== 0n ? 'Earned' : 'Not earned'} · {name}</li>)}</ul> : <p>Unavailable — verify a Chog and retrieve its contract state first.</p>}</details>
  </section>
}
export function Adventure(props: {now?: number; selectedToken?: bigint; onHome: () => void} & AdventureNavigation) {
  return localMode ? <LocalContractAdventure {...props}/> : <MainnetReadAdventure {...props}/>
}
