import {useEffect, useRef, useState} from 'react'
import {useReadContract} from 'wagmi'
import {zeroAddress} from 'viem'
import {activeChain, approvedGameAddress, CHOG_GENESIS, gameReadAbi, localMode} from './contracts'
import {achievements, events, titles} from './game-data'
import {parseTokenId} from './utils'
import {useSurvivorIdentity, survivorReadFreshness as freshness} from './useSurvivorIdentity'
import './character.css'
import {YourSurvivors} from './YourSurvivors'
import {useSurvivalHistory} from './useSurvivalHistory'
import {SurvivorJournal} from './SurvivorJournal'
import {useNftMetadata} from './useNftMetadata'

const criteria = [
  'Resolve your first encounter.', 'Reinforce the Broken Bridge three times.',
  'Reach 80 Trust.', 'Reach 30 Scars.', 'Resolve Ancient Gate three times, with any choice.',
  'Resolve all six encounter types.', 'Act on seven consecutive UTC days.',
  'Seven consecutive daily actions requesting no additional Scars, after modifiers and before clamping.',
]

// Code-native book ornamentation; never presented as selected NFT artwork.
function Ornament({className = ''}: {className?: string}) {
  return <svg className={`sheet-ornament ${className}`} viewBox="0 0 100 100" fill="none" stroke="currentColor" aria-hidden="true" focusable="false">
    <path d="M8 92V8h84M15 85V15h70M8 58c26 0 44-20 44-44M15 42c20 0 27-12 27-27M24 24c20-8 34 8 20 20s-26-4-18-12c5-5 13 0 8 5M58 8c0 14 23 10 20 0M8 78c14 0 10-23 0-20"/>
    <path d="m52 52 6-14 6 14-6 14-6-14ZM24 58c-1 13 10 16 15 9-13 2-12-9-15-9ZM58 24c13-1 16 10 9 15 2-13-9-12-9-15Z"/>
    <circle cx="15" cy="15" r="4"/>
  </svg>
}

function SurvivorSeal() {
  return <svg className="survivor-seal" viewBox="0 0 200 200" fill="none" stroke="currentColor" aria-hidden="true" focusable="false">
    <circle cx="100" cy="100" r="87"/><circle cx="100" cy="100" r="78"/><circle cx="100" cy="100" r="54"/>
    <path d="M100 8v24m0 136v24M8 100h24m136 0h24M35 35l18 18m94 94 18 18M35 165l18-18m94-94 18-18M100 34l13 53 53 13-53 13-13 53-13-53-53-13 53-13 13-53Z"/>
    <path d="m100 58 7 35 35 7-35 7-7 35-7-35-35-7 35-7 7-35Z"/>
    <circle cx="100" cy="100" r="8"/>
  </svg>
}

export function Character({selectedToken, onSelectToken, initialSection}: {selectedToken?: bigint; onSelectToken: (token: bigint) => void; initialSection?: 'your-survivors-title' | 'history-title'}) {
  const {owner, enabled, scopeKey, contextKey, checkingOwner, verified, controls, ownershipMessage} = useSurvivorIdentity(selectedToken)
  useEffect(() => {
    if (!initialSection) return
    const heading = document.getElementById(initialSection)
    heading?.setAttribute('tabindex', '-1')
    heading?.focus({preventScroll: true})
    heading?.scrollIntoView?.({block: 'start'})
  }, [initialSection])
  const [enteredId, setEnteredId] = useState(selectedToken?.toString() ?? '')
  const token = parseTokenId(enteredId)
  const currentContext = useRef(contextKey)
  currentContext.current = contextKey
  const binding = useReadContract({address: approvedGameAddress, abi: gameReadAbi, functionName: 'CHOG_GENESIS',
    chainId: activeChain.id, scopeKey, query: {...freshness, enabled: verified && approvedGameAddress !== undefined}})
  const bound = verified && approvedGameAddress !== undefined && !binding.isFetching && !binding.isLoading && !binding.isError && binding.data?.toLowerCase() === CHOG_GENESIS.toLowerCase()
  const character = useReadContract({address: approvedGameAddress, abi: gameReadAbi, functionName: 'characterOf',
    args: selectedToken === undefined ? undefined : [selectedToken], chainId: activeChain.id, scopeKey,
    query: {...freshness, enabled: bound}})
  const title = useReadContract({address: approvedGameAddress, abi: gameReadAbi, functionName: 'titleOf',
    args: selectedToken === undefined ? undefined : [selectedToken], chainId: activeChain.id, scopeKey,
    query: {...freshness, enabled: bound}})
  const state = bound && !character.isFetching && !character.isLoading && !character.isError ? character.data : undefined
  const titleName = bound && !title.isFetching && !title.isLoading && !title.isError && title.data !== undefined ? titles[title.data] : undefined
  const history = useSurvivalHistory(selectedToken, bound)
  const metadata = useNftMetadata(selectedToken, verified, scopeKey)

  let progressionMessage = `Progression unavailable — no approved game deployment is configured. NFT ownership can still be verified on ${localMode ? 'the local test fixture' : 'Monad'}.`
  if (approvedGameAddress !== undefined) {
    if (!verified) progressionMessage = 'Progression unavailable until this NFT identity has been verified on Monad.'
    else if (binding.isFetching || binding.isLoading) progressionMessage = 'Checking the game’s canonical collection binding…'
    else if (binding.isError) progressionMessage = 'Game binding read failed. Progression is unavailable; retry to verify the deployment binding.'
    else if (!bound) progressionMessage = 'Game binding unavailable or mismatched. Survivor progression is not trusted.'
    else if (character.isError) progressionMessage = 'Progression read failed. No stats or achievements can be verified; retry the read.'
    else if (!state) progressionMessage = 'Reading recorded survivor state…'
    else progressionMessage = `${localMode ? 'LOCAL TEST FIXTURE — NOT CHOG GENESIS. Recorded local contract state.' : 'Recorded contract state · read only. Gameplay transactions remain disabled.'}`
  }

  async function refresh() {
    if (!enabled) return
    const refreshedOwner = await owner.refetch()
    if (currentContext.current !== contextKey || refreshedOwner.isError || !refreshedOwner.data || refreshedOwner.data === zeroAddress) return
    // Refresh already-enabled reads only; dependent reads enable naturally after verification.
    if (verified && approvedGameAddress !== undefined) {
      const refreshedBinding = await binding.refetch()
      if (currentContext.current !== contextKey || refreshedBinding.isError || refreshedBinding.data?.toLowerCase() !== CHOG_GENESIS.toLowerCase()) return
    }
    if (bound) await Promise.all([character.refetch(), title.refetch()])
  }
  const outcome = state?.hasActed && state.lastOutcomeId >= 1 && state.lastOutcomeId <= 18
    ? `${events[Math.floor((state.lastOutcomeId - 1) / 3)].name} · ${events[Math.floor((state.lastOutcomeId - 1) / 3)].choices[(state.lastOutcomeId - 1) % 3]} (outcome ${state.lastOutcomeId})` : undefined

  return <section className="survivor-profile" aria-labelledby="survivor-profile-title">
    <Ornament className="sheet-corner-top-left"/><Ornament className="sheet-corner-top-right"/>
    <Ornament className="sheet-corner-bottom-left"/><Ornament className="sheet-corner-bottom-right"/>
    <header className="survivor-heading"><div><p className="survivor-eyebrow">SURVIVOR PROFILE</p>
      <p className="survivor-sheet-heading">The Chog is the survivor.</p>
      <p className="survivor-motto">The wallet controls the survivor. <span>The Chog carries its story.</span></p></div>
      <span className="survivor-readonly">READ ONLY</span></header>

    <div className="survivor-ledger">
      <section className="survivor-identity" aria-labelledby="survivor-profile-title">
        <figure className="survivor-portrait" aria-label="Decorative portrait placeholder">
          <div className="survivor-portrait-frame"><Ornament className="portrait-corner-left"/><Ornament className="portrait-corner-right"/>
            <span className="portrait-crown" aria-hidden="true">✦</span>
            <SurvivorSeal/><span className="portrait-caption">A story yet to be revealed</span>
            <span className="portrait-medallion" aria-hidden="true">✧</span>
          </div>
          <figcaption>{metadata.metadata?.name ? `${metadata.metadata.name} · artwork withheld pending written permission.` : metadata.tokenUri.isLoading || metadata.tokenUri.isFetching ? 'Reading token metadata…' : metadata.error ? `Metadata unavailable · ${metadata.error}` : 'Portrait unavailable · verified NFT artwork has not been loaded.'}</figcaption>
        </figure>
        <h1 id="survivor-profile-title">{verified ? `CHOG #${selectedToken}` : 'A Chog. A story.'}</h1>
        <p className="survivor-collection">CHOG GENESIS · TOKEN-BOUND IDENTITY</p>
        <YourSurvivors selectedToken={selectedToken} onSelectToken={token => { setEnteredId(token.toString()); onSelectToken(token) }}/>
        <div className="survivor-section-heading"><h2 id="identity-title">Find your survivor</h2></div>
        <p className="survivor-small">Enter a token ID from Chog Genesis for manual verification, including when discovery is unavailable or partial.</p>
        <form onSubmit={(event) => { event.preventDefault(); if (token !== undefined) { if (token === selectedToken) void refresh(); else onSelectToken(token) } }}>
          <label htmlFor="token-id">Token ID</label><div className="survivor-entry"><input id="token-id" inputMode="numeric" autoComplete="off" value={enteredId} onChange={(event) => setEnteredId(event.target.value)} aria-invalid={enteredId.length > 0 && token === undefined} aria-describedby="survivor-input-help"/><button type="submit" disabled={token === undefined}>Check token</button></div>
          <p id="survivor-input-help" className={enteredId.length > 0 && token === undefined ? 'survivor-error' : 'survivor-small'}>{enteredId.length > 0 && token === undefined ? 'Use a whole-number token ID from 0 to 2²⁵⁶ − 1.' : 'Your entry becomes a survivor identity only after the collection confirms its owner.'}</p>
        </form>
        <div className={`survivor-control ${controls ? 'survivor-control-owned' : ''}`} role="status" aria-live="polite">
          <p className="survivor-eyebrow">{verified ? 'VERIFIED NFT IDENTITY' : 'IDENTITY UNVERIFIED'}</p>
          {selectedToken !== undefined && !verified && <p className="survivor-requested">Requested ID: {selectedToken.toString()}</p>}
          <p>{ownershipMessage}</p>
          {verified && <dl><dt>Current verified owner</dt><dd className="survivor-address">{owner.data}</dd></dl>}
          <button type="button" className="survivor-retry" disabled={!enabled || checkingOwner} onClick={() => void refresh()}>{checkingOwner ? 'Verifying…' : 'Refresh ownership & profile'}</button>
          {verified && <small>Verified at the latest completed read. Ownership is rechecked every 30 seconds while this profile is open and when you return to the window.</small>}
        </div>
      </section>

      <section className="survivor-progress" aria-labelledby="progress-title" aria-busy={bound && character.isFetching}><div className="survivor-section-heading"><span className="survivor-section-number" aria-hidden="true">II</span><h2 id="progress-title">Trail status</h2></div>
        <p role="status">{progressionMessage}</p>
        <div className="survivor-title"><span>Survivor title</span><strong>{titleName ?? 'Unavailable'}</strong></div>
        {bound && title.isError && <p className="survivor-error">Title read failed. Refresh to retrieve the actual title.</p>}
        <dl className="survivor-stats">
          <div className="survivor-stat-xp"><dt>XP</dt><dd>{state?.xp.toLocaleString() ?? '—'}</dd><span className="survivor-stat-note">Recorded experience</span></div>
          {(['Trust', 'Scars'] as const).map((label) => {
            const value = state?.[label === 'Trust' ? 'trust' : 'scars']
            return <div className={`survivor-stat-${label.toLowerCase()}`} key={label}><dt>{label}</dt><dd>{value === undefined ? '—' : `${value}/100`}</dd>
              {value === undefined ? <span className="survivor-meter-unavailable" aria-hidden="true"/> : <meter aria-label={label} min={0} max={100} value={value}/>}
            </div>
          })}
          <div className="survivor-stat-streak"><dt>Stored streak</dt><dd>{state ? `${state.streak} days` : '—'}</dd><span className="survivor-stat-note">Consecutive UTC days</span></div>
        </dl>
        <p className="survivor-small">{state ? `Unmarked run: ${state.unmarkedStreak}/7 qualifying consecutive actions.` : 'Stats and achievement status are unavailable. No demo values are substituted.'}</p>
        <p className="survivor-small">The stored streak updates on an action. A missed UTC day breaks continuation on the next action.</p>
        <section className="survivor-daily" aria-labelledby="daily-title"><h2 id="daily-title">One Chog. One daily decision.</h2><p>Each NFT can resolve one encounter per UTC day. A transfer carries that daily lock to the new owner.</p>
          <dl><dt>Last recorded action</dt><dd>{state ? state.hasActed ? `UTC day ${state.lastActionDay.toString()} · ${outcome ?? `Outcome ${state.lastOutcomeId}`}` : 'No action recorded in this game contract.' : 'Unavailable'}</dd><dt>Daily availability</dt><dd>Unverified — a current chain-day eligibility check is unavailable here. Gameplay remains disabled.</dd></dl>
          <p className="survivor-small">UTC resets at 00:00. Browser time is not used to claim live eligibility or an authoritative countdown.</p>
        </section>
      </section>

      <section className="survivor-achievements" aria-labelledby="achievements-title"><div className="survivor-section-heading"><span className="survivor-section-number" aria-hidden="true">III</span><h2 id="achievements-title">Marks of survival</h2></div><p>Achievements stay with the Chog once earned. Titles reflect its recorded stats.</p>
        <ul>{achievements.map((name, index) => { const earned = state !== undefined && (state.achievementMask & (1n << BigInt(index))) !== 0n; return <li key={name} className={earned ? 'survivor-earned' : state ? 'survivor-locked' : 'survivor-mark-unavailable'}><span className="survivor-achievement-symbol" aria-hidden="true">{['☼', '⌘', '❧', 'ϟ', '⟐', '✥', '✺', '❖'][index]}</span><div><strong>{name}</strong><small>{criteria[index]}</small><b>{state ? earned ? 'Earned' : 'Not earned' : 'Unavailable'}</b></div></li> })}</ul>
        {state && <p className="survivor-small">Recorded encounter types: {events.filter((_, index) => (state.eventMask & (1 << index)) !== 0).map((event) => event.name).join(', ') || 'None'}.</p>}
      </section>

      <section className="survivor-history" aria-labelledby="history-title"><div className="survivor-section-heading"><span className="survivor-section-number" aria-hidden="true">IV</span><h2 id="history-title">Survival History</h2><span className="survivor-journal-label">THE SURVIVAL JOURNAL</span></div>
        {!localMode && <div className="survivor-history-unavailable"><span className="survivor-history-symbol" aria-hidden="true">✧</span><div><h3>The story stays with the Chog.</h3><p>History unavailable — no approved production game deployment and deployment start block are configured. Recorded decisions belong to the token ID, across owners.</p><p>No timeline has been loaded. This does not mean the survivor has no history.</p></div></div>}
        {localMode && !bound && <div className="survivor-history-unavailable"><span className="survivor-history-symbol" aria-hidden="true">✧</span><div><h3>The story stays with the Chog.</h3><p>Verify the local fixture identity and game binding before reading token-bound history.</p></div></div>}
        {localMode && bound && history.loading && <div className="survivor-history-unavailable"><span className="survivor-history-symbol" aria-hidden="true">✧</span><div><h3>Reading the local survival journal…</h3><p>Events are being retrieved from the deployed local game contract.</p></div></div>}
        {localMode && bound && !history.loading && history.result?.error && <div className="survivor-history-unavailable"><span className="survivor-history-symbol" aria-hidden="true">✧</span><div><h3>{history.result.partial ? 'Partial local history' : 'History unavailable'}</h3><p>{history.result.error} {history.result.partial ? 'Shown entries are incomplete; refresh before relying on them.' : 'No history claim is made.'}</p><button className="survivor-retry" onClick={history.refresh}>Retry history</button></div></div>}
        {localMode && bound && !history.loading && history.result && <>{history.result.records.length === 0 && !history.result.error ? <div className="survivor-history-unavailable"><span className="survivor-history-symbol" aria-hidden="true">✧</span><div><h3>No recorded decisions.</h3><p>This token has no AdventureResolved events in the configured local deployment range.</p></div></div> : <SurvivorJournal tokenId={selectedToken!} currentOwner={owner.data!} records={history.result.records}/>}</>}
      </section>
    </div>

    <aside className="survivor-inheritance"><span className="survivor-inheritance-seal" aria-hidden="true">✦</span><div><h2>A new owner. The same survivor.</h2><p>When ownership changes, the new owner controls the same Chog’s progression, achievements and history. The wallet is the controller; the NFT is the survivor.</p><p className="survivor-small">Progress belongs to the numeric token ID, including if that ID is ever reissued. This interface does not prove collection immutability, governance safety or token-ID non-reuse. Adventure is contract-backed only in the clearly labeled isolated local environment.</p></div></aside>
  </section>
}
