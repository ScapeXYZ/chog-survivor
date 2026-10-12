import {useRef, useState} from 'react'
import {useAccount, useReadContract} from 'wagmi'
import {toFunctionSelector, zeroAddress} from 'viem'
import {approvedGameAddress, CHOG_GENESIS, gameReadAbi, monad, nftAbi} from './contracts'
import {achievements, events, titles} from './game-data'
import {parseTokenId} from './utils'
import './character.css'

// An ambiguous ownerOf revert does not establish that an NFT is nonexistent.
function ownershipFailure(error: unknown): 'nonexistent' | 'reverted' | 'rpc' {
  const seen = new Set<unknown>()
  let reverted = false
  while (error && typeof error === 'object' && !seen.has(error)) {
    seen.add(error)
    const item = error as {name?: string; data?: {errorName?: string} | string; raw?: string; cause?: unknown}
    if ((typeof item.data === 'object' && item.data?.errorName === 'ERC721NonexistentToken') ||
      (item.raw ?? (typeof item.data === 'string' ? item.data : ''))?.startsWith(toFunctionSelector('ERC721NonexistentToken(uint256)'))) return 'nonexistent'
    if (item.name === 'ContractFunctionRevertedError') reverted = true
    error = item.cause
  }
  return reverted ? 'reverted' : 'rpc'
}

const criteria = [
  'Resolve your first encounter.', 'Reinforce the Broken Bridge three times.',
  'Reach 80 Trust.', 'Reach 30 Scars.', 'Resolve Ancient Gate three times, with any choice.',
  'Resolve all six encounter types.', 'Act on seven consecutive UTC days.',
  'Seven consecutive daily actions requesting no additional Scars, after modifiers and before clamping.',
]

export function Character({selectedToken, onSelectToken}: {selectedToken?: bigint; onSelectToken: (token: bigint) => void}) {
  // useChainId reports configured chain state, which may stay at 143 on an unsupported wallet chain.
  const {address, isConnected, chainId} = useAccount()
  const [enteredId, setEnteredId] = useState(selectedToken?.toString() ?? '')
  const token = parseTokenId(enteredId)
  const connected = isConnected && address !== undefined
  const onMonad = chainId === monad.id
  const enabled = connected && onMonad && selectedToken !== undefined
  // Account/network scope prevents a previous controller's cached result becoming current identity.
  const scopeKey = `survivor:${address ?? 'disconnected'}:${chainId}`
  const contextKey = `${scopeKey}:${selectedToken}`
  const currentContext = useRef(contextKey)
  currentContext.current = contextKey
  const freshness = {staleTime: 0, refetchOnMount: 'always' as const, refetchOnWindowFocus: true, refetchInterval: 30_000}
  const owner = useReadContract({address: CHOG_GENESIS, abi: nftAbi, functionName: 'ownerOf',
    args: selectedToken === undefined ? undefined : [selectedToken], chainId: monad.id, scopeKey,
    query: {...freshness, enabled}})
  const checkingOwner = enabled && (owner.isFetching || owner.isLoading)
  const verified = enabled && !checkingOwner && !owner.isError && owner.data !== undefined && owner.data !== zeroAddress
  const controls = verified && owner.data?.toLowerCase() === address?.toLowerCase()
  const binding = useReadContract({address: approvedGameAddress, abi: gameReadAbi, functionName: 'CHOG_GENESIS',
    chainId: monad.id, scopeKey, query: {...freshness, enabled: verified && approvedGameAddress !== undefined}})
  const bound = verified && approvedGameAddress !== undefined && !binding.isFetching && !binding.isLoading && !binding.isError && binding.data?.toLowerCase() === CHOG_GENESIS.toLowerCase()
  const character = useReadContract({address: approvedGameAddress, abi: gameReadAbi, functionName: 'characterOf',
    args: selectedToken === undefined ? undefined : [selectedToken], chainId: monad.id, scopeKey,
    query: {...freshness, enabled: bound}})
  const title = useReadContract({address: approvedGameAddress, abi: gameReadAbi, functionName: 'titleOf',
    args: selectedToken === undefined ? undefined : [selectedToken], chainId: monad.id, scopeKey,
    query: {...freshness, enabled: bound}})
  const state = bound && !character.isFetching && !character.isLoading && !character.isError ? character.data : undefined
  const titleName = bound && !title.isFetching && !title.isLoading && !title.isError && title.data !== undefined ? titles[title.data] : undefined

  let ownershipMessage = 'Enter a Chog Genesis token ID to look up its survivor.'
  if (!connected) ownershipMessage = 'Wallet disconnected. Connect your wallet to verify the current controller.'
  else if (chainId === undefined) ownershipMessage = 'Wallet network unavailable. Reconnect your wallet to verify its chain before ownership reads.'
  else if (!onMonad) ownershipMessage = 'Wrong network. Select Monad (chain ID 143) in your wallet to verify ownership.'
  else if (checkingOwner) ownershipMessage = 'Checking canonical ownerOf… Identity is not yet verified.'
  else if (enabled && owner.isError) {
    const failure = ownershipFailure(owner.error)
    ownershipMessage = failure === 'nonexistent' ? 'NFT nonexistent: the collection reports that this token ID does not exist. It may have been burned.' :
      failure === 'reverted' ? 'NFT unavailable: ownerOf reverted. Nonexistence, burn or collection restrictions cannot be distinguished from this response.' :
      'RPC failure. Current ownership could not be verified. Retry the read.'
  } else if (verified) ownershipMessage = controls ? 'You control this survivor. Your connected wallet is its current owner.' : 'Another wallet controls this survivor. You can inspect its read-only profile.'
  else if (enabled && owner.data === zeroAddress) ownershipMessage = 'NFT unavailable: the collection returned a zero owner. No current controller is verified.'
  else if (enabled) ownershipMessage = 'Ownership verification is pending. No survivor identity is confirmed.'

  let progressionMessage = 'Progression unavailable — no approved game deployment is configured. NFT ownership can still be verified on Monad.'
  if (approvedGameAddress !== undefined) {
    if (!verified) progressionMessage = 'Progression unavailable until this NFT identity has been verified on Monad.'
    else if (binding.isFetching || binding.isLoading) progressionMessage = 'Checking the game’s canonical collection binding…'
    else if (binding.isError) progressionMessage = 'Game binding read failed. Progression is unavailable; retry to verify the deployment binding.'
    else if (!bound) progressionMessage = 'Game binding unavailable or mismatched. Survivor progression is not trusted.'
    else if (character.isError) progressionMessage = 'Progression read failed. No stats or achievements can be verified; retry the read.'
    else if (!state) progressionMessage = 'Reading recorded survivor state…'
    else progressionMessage = 'Recorded contract state · read only. Gameplay transactions remain disabled.'
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
    <header className="survivor-heading"><div><p className="survivor-eyebrow">SURVIVOR PROFILE</p>
      <h1 id="survivor-profile-title">{verified ? `CHOG #${selectedToken}` : 'A Chog. A story.'}</h1>
      <p className="survivor-motto">The wallet controls the survivor. <span>The Chog carries its story.</span></p></div>
      <span className="survivor-readonly">READ ONLY</span></header>

    <div className="survivor-ledger">
      <section className="survivor-identity" aria-labelledby="identity-title"><div className="survivor-section-heading"><span className="survivor-section-number" aria-hidden="true">I</span><h2 id="identity-title">Find your survivor</h2></div>
        <p>Enter a token ID from Chog Genesis. Ownership discovery is not available here; no holdings are assumed.</p>
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
        <dl className="survivor-stats">{[['XP', state?.xp?.toLocaleString()], ['Trust', state ? `${state.trust}/100` : undefined], ['Scars', state ? `${state.scars}/100` : undefined], ['Stored streak', state ? `${state.streak} days` : undefined]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? '—'}</dd></div>)}</dl>
        <p className="survivor-small">{state ? `Unmarked run: ${state.unmarkedStreak}/7 qualifying consecutive actions.` : 'Stats and achievement status are unavailable. No demo values are substituted.'}</p>
        <p className="survivor-small">The stored streak updates on an action. A missed UTC day breaks continuation on the next action.</p>
      </section>

      <section className="survivor-achievements" aria-labelledby="achievements-title"><h2 id="achievements-title">Marks of survival</h2><p>Achievements stay with the Chog once earned. Titles reflect its recorded stats.</p>
        <ul>{achievements.map((name, index) => { const earned = state !== undefined && (state.achievementMask & (1n << BigInt(index))) !== 0n; return <li key={name} className={earned ? 'survivor-earned' : ''}><span aria-hidden="true">{earned ? '✦' : '◇'}</span><div><strong>{name}</strong><small>{criteria[index]}</small></div><b>{state ? earned ? 'Earned' : 'Not earned' : 'Unavailable'}</b></li> })}</ul>
        {state && <p className="survivor-small">Recorded encounter types: {events.filter((_, index) => (state.eventMask & (1 << index)) !== 0).map((event) => event.name).join(', ') || 'None'}.</p>}
      </section>

      <section className="survivor-daily" aria-labelledby="daily-title"><h2 id="daily-title">One Chog. One daily decision.</h2><p>Each NFT can resolve one encounter per UTC day. A transfer carries that daily lock to the new owner.</p>
        <dl><dt>Last recorded action</dt><dd>{state ? state.hasActed ? `UTC day ${state.lastActionDay.toString()} · ${outcome ?? `Outcome ${state.lastOutcomeId}`}` : 'No action recorded in this game contract.' : 'Unavailable'}</dd><dt>Daily availability</dt><dd>Unverified — a current chain-day eligibility check is unavailable here. Gameplay remains disabled.</dd></dl>
        <p className="survivor-small">UTC resets at 00:00. Browser time is not used to claim live eligibility or an authoritative countdown.</p>
      </section>

      <section className="survivor-history" aria-labelledby="history-title"><div className="survivor-section-heading"><span className="survivor-section-number" aria-hidden="true">III</span><h2 id="history-title">Survival History</h2></div>
        <div className="survivor-history-unavailable"><span className="survivor-history-symbol" aria-hidden="true">✧</span><div><h3>The story stays with the Chog.</h3><p>{approvedGameAddress === undefined ? 'History unavailable — no approved game deployment is configured.' : 'History unavailable — this profile does not retrieve the game’s action logs.'} Recorded decisions belong to the token ID, across owners.</p><p>No timeline has been loaded. This does not mean the survivor has no history.</p></div></div>
      </section>
    </div>

    <aside className="survivor-inheritance"><h2>A new owner. The same survivor.</h2><p>When ownership changes, the new owner controls the same Chog’s progression, achievements and history. The wallet is the controller; the NFT is the survivor.</p><p className="survivor-small">Progress belongs to the numeric token ID, including if that ID is ever reissued. This interface does not prove collection immutability, governance safety or token-ID non-reuse. Adventure remains a separate, clearly labeled local demo.</p></aside>
  </section>
}
