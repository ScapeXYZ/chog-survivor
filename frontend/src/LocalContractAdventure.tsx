import {useEffect, useRef, useState} from 'react'
import {usePublicClient, useReadContract, useWriteContract} from 'wagmi'
import {zeroAddress} from 'viem'
import {activeChain, approvedGameAddress, CHOG_GENESIS, gameLocalWriteAbi, gameReadAbi} from './contracts'
import {events, titles} from './game-data'
import {shortAddress, signed} from './utils'
import {survivorReadFreshness, useSurvivorIdentity} from './useSurvivorIdentity'
import wildEnvironment from './assets/ruined-wild-environment-provisional.webp'
import fogOverlay from './assets/moonlit-fog-overlay-provisional.webp'

type ContractPreview = {day: bigint; eventId: number; choiceId: number; outcomeId: number; xpDelta: number; trustDelta: number; scarsDelta: number; xpAfter: number; trustAfter: number; scarsAfter: number; streakAfter: number; unmarkedStreakAfter: number; newlyEarnedAchievementMask: bigint; achievementMaskAfter: bigint; titleId: number; canAct: boolean}
type TxState = 'ready' | 'confirming' | 'submitted' | 'confirmed' | 'rejected' | 'failed'

function LocalResult({eventIndex, choiceIndex, preview, state, onClose, onConfirm}: {eventIndex: number; choiceIndex: number; preview?: ContractPreview; state: TxState; onClose: () => void; onConfirm: () => void}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const event = events[eventIndex]
  useEffect(() => { dialog.current?.showModal(); return () => dialog.current?.close() }, [])
  const pending = state === 'confirming' || state === 'submitted'
  return <dialog ref={dialog} className={`adventure-result adventure-result-${event.tags[choiceIndex]}`} aria-labelledby="local-preview-title" onCancel={(e) => { e.preventDefault(); if (!pending) onClose() }}>
    <div className="adventure-result-heading"><div className="adventure-result-stamp" aria-hidden="true"><i/><i/></div><div><p className="adventure-result-encounter">{event.name}</p><p className="adventure-eyebrow">LOCAL CONTRACT PREVIEW</p></div></div>
    <h2 id="local-preview-title">{event.choices[choiceIndex]}</h2>
    {preview ? <><p className="adventure-result-label">Authoritative contract preview · outcome {preview.outcomeId}</p><dl className="adventure-result-rewards"><div><dt>XP</dt><dd>{signed(preview.xpDelta)}</dd></div><div><dt>Trust</dt><dd>{signed(preview.trustDelta)}</dd></div><div><dt>Scars</dt><dd>{signed(preview.scarsDelta)}</dd></div></dl><p className="adventure-result-disclosure">After action: {preview.xpAfter} XP · {preview.trustAfter}/100 Trust · {preview.scarsAfter}/100 Scars. This preview is not a confirmed result.</p></> : <p className="adventure-result-disclosure">Reading the contract preview…</p>}
    {state === 'ready' && <button className="adventure-return-choice" disabled={!preview?.canAct} onClick={onConfirm}>{preview?.canAct ? 'CONFIRM LOCAL ACTION' : 'DAILY ACTION UNAVAILABLE'}</button>}
    {state === 'confirming' && <p className="adventure-result-disclosure">Awaiting wallet confirmation…</p>}
    {state === 'submitted' && <p className="adventure-result-disclosure">Transaction submitted. Waiting for Anvil confirmation…</p>}
    {state === 'confirmed' && <p className="adventure-result-disclosure">Confirmed on local Anvil. Authoritative survivor reads were refreshed.</p>}
    {(state === 'rejected' || state === 'failed') && <p className="adventure-result-disclosure">{state === 'rejected' ? 'Wallet rejected the request.' : 'Transaction failed or reverted. No confirmed survivor update is shown.'}</p>}
    {!pending && <button className="adventure-return-choice" onClick={onClose}>{state === 'ready' ? 'CANCEL' : 'RETURN TO ADVENTURE'}</button>}
  </dialog>
}

export function LocalContractAdventure({selectedToken, onHome, onCharacter}: {selectedToken?: bigint; onHome: () => void; onCharacter?: () => void}) {
  const identity = useSurvivorIdentity(selectedToken)
  const client = usePublicClient({chainId: activeChain.id})
  const {writeContractAsync} = useWriteContract()
  const [day, setDay] = useState<bigint>()
  const [choice, setChoice] = useState<number>()
  const [txState, setTxState] = useState<TxState>('ready')
  const scopeKey = identity.scopeKey
  const safeBase = identity.verified && approvedGameAddress !== undefined
  const binding = useReadContract({address: approvedGameAddress, abi: gameReadAbi, functionName: 'CHOG_GENESIS', chainId: activeChain.id, scopeKey, query: {...survivorReadFreshness, enabled: safeBase}})
  const bound = safeBase && !binding.isLoading && !binding.isFetching && !binding.isError && binding.data?.toLowerCase() === CHOG_GENESIS.toLowerCase()
  const character = useReadContract({address: approvedGameAddress, abi: gameReadAbi, functionName: 'characterOf', args: selectedToken === undefined ? undefined : [selectedToken], chainId: activeChain.id, scopeKey, query: {...survivorReadFreshness, enabled: bound}})
  const title = useReadContract({address: approvedGameAddress, abi: gameReadAbi, functionName: 'titleOf', args: selectedToken === undefined ? undefined : [selectedToken], chainId: activeChain.id, scopeKey, query: {...survivorReadFreshness, enabled: bound}})
  const encounter = useReadContract({address: approvedGameAddress, abi: gameReadAbi, functionName: 'eventFor', args: selectedToken === undefined || day === undefined ? undefined : [selectedToken, day], chainId: activeChain.id, scopeKey, query: {...survivorReadFreshness, enabled: bound && day !== undefined}})
  const preview = useReadContract({address: approvedGameAddress, abi: gameReadAbi, functionName: 'preview', args: selectedToken === undefined || choice === undefined ? undefined : [selectedToken, choice + 1], chainId: activeChain.id, scopeKey, query: {...survivorReadFreshness, enabled: bound && choice !== undefined}})

  useEffect(() => {
    let cancelled = false
    async function readDay() { try { const block = await client?.getBlock(); if (!cancelled && block) setDay(block.timestamp / 86_400n) } catch { if (!cancelled) setDay(undefined) } }
    void readDay(); const timer = window.setInterval(() => void readDay(), 15_000)
    return () => { cancelled = true; window.clearInterval(timer) }
  }, [client, identity.contextKey])
  useEffect(() => { setChoice(undefined); setTxState('ready') }, [identity.contextKey])

  const state = character.data
  const contractPreview = preview.data as ContractPreview | undefined
  const eventIndex = encounter.data === undefined ? undefined : Number(encounter.data) - 1
  const event = eventIndex === undefined ? undefined : events[eventIndex]
  const alreadyActed = !!state?.hasActed && state.lastActionDay === day
  const mayAct = bound && identity.controls && !alreadyActed && event !== undefined && day !== undefined
  const titleName = title.data === undefined ? 'Unavailable' : titles[Number(title.data)]

  async function confirm() {
    if (!mayAct || selectedToken === undefined || choice === undefined || txState !== 'ready') return
    setTxState('confirming')
    try {
      const hash = await writeContractAsync({address: approvedGameAddress!, abi: gameLocalWriteAbi, functionName: 'act', args: [selectedToken, choice + 1], chainId: activeChain.id})
      setTxState('submitted')
      await client?.waitForTransactionReceipt({hash})
      await Promise.all([identity.owner.refetch(), binding.refetch(), character.refetch(), title.refetch(), encounter.refetch(), preview.refetch()])
      setTxState('confirmed')
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      setTxState(message.includes('reject') || message.includes('denied') ? 'rejected' : 'failed')
    }
  }

  const status = !identity.connected ? 'Connect a local Anvil wallet to play.' : !identity.onMonad ? 'Switch to Local Anvil chain 31338.' : !identity.verified ? identity.ownershipMessage : !bound ? 'Verifying the frozen game binding…' : !identity.controls ? 'Another wallet controls this local test survivor.' : alreadyActed ? 'This survivor has already acted for the current local-chain UTC day.' : 'Ready for one local contract-backed action.'
  const hud = state
  return <section className="adventure-game" aria-labelledby="adventure-title">
    <header className="adventure-hud"><div className="adventure-brand"><span className="adventure-emblem">CS</span><div><strong>CHOG SURVIVOR</strong><span className="adventure-demo-badge">LOCAL CONTRACT TEST · NOT MONAD MAINNET</span></div></div><div className="adventure-stat-group"><span className="adventure-stat-disclosure">ONCHAIN SURVIVOR STATE</span><dl className="adventure-stats" aria-label="Contract-backed character statistics"><div><dt>XP</dt><dd>{hud?.xp ?? '—'}</dd></div><div><dt>Trust</dt><dd>{hud ? `${hud.trust}` : '—'}<small>/100</small></dd></div><div><dt>Scars</dt><dd>{hud ? `${hud.scars}` : '—'}<small>/100</small></dd></div><div><dt>Streak</dt><dd>{hud?.streak ?? '—'}<small> days</small></dd></div></dl></div><button className="adventure-home" onClick={onHome}>← Back to Home</button></header>
    <aside className="adventure-survivor"><div role="status" aria-live="polite"><span className="adventure-survivor-label">LOCAL TEST FIXTURE — NOT CHOG GENESIS</span><strong>{identity.verified ? `CHOG #${selectedToken}` : selectedToken === undefined ? 'No survivor selected' : `Requested token #${selectedToken}`}</strong><p>{status}{identity.verified && <span> Owner: {shortAddress(identity.owner.data)}.</span>}</p></div><p className="adventure-survivor-disclosure">Encounter day: {day === undefined ? 'reading local chain…' : `UTC day ${day}`}. Title: {titleName}.</p><div className="adventure-survivor-actions">{onCharacter && <button onClick={onCharacter}>View survivor profile →</button>}<button disabled={!identity.enabled} onClick={() => void identity.owner.refetch()}>Refresh ownership</button></div></aside>
    <div className="adventure-stage"><div className="adventure-world" role="img" aria-label="Moonlit forest with ruined stone gateways"><img className="adventure-environment" src={wildEnvironment} alt=""/><div className="adventure-scene-wash"/><img className="adventure-mist adventure-mist-back" src={fogOverlay} alt=""/><img className="adventure-mist" src={fogOverlay} alt=""/></div><div className="adventure-scene-heading"><div className="adventure-encounter-seal" data-encounter={(eventIndex ?? 0) + 1}><i/><i/><i/></div><div><p className="adventure-eyebrow">AUTHORITATIVE DAILY ENCOUNTER · {eventIndex === undefined ? 'READING' : `EVENT ${String(eventIndex + 1).padStart(2, '0')} / 06`}</p><h1 id="adventure-title">{event?.name ?? 'Reading the wild…'}</h1><p className="adventure-scene-motto">Every choice leaves a mark.</p></div></div><div className="adventure-trail-tag"><span className="adventure-eyebrow">LOCAL CHAIN TRAIL</span><strong>{titleName}</strong><span>Token-bound progression · read only until you confirm</span></div></div>
    <section className="adventure-controls"><div className="adventure-story"><div><p className="adventure-eyebrow">YOUR NEXT MOVE</p><h2>How will you survive?</h2></div><p>{event?.narrative ?? 'The local contract determines the encounter before choices become available.'}</p></div><div className="adventure-choices">{(event?.choices ?? []).map((name, index) => <button key={name} disabled={!mayAct || txState === 'confirming' || txState === 'submitted'} className={`adventure-choice adventure-choice-${event!.tags[index]}`} onClick={() => { setChoice(index); setTxState('ready') }}><span className="adventure-choice-top"><span className="adventure-choice-number">0{index + 1}</span><span className="adventure-choice-category">{event!.tags[index]}</span></span><strong>{name}</strong><span className="adventure-choice-action">Preview contract result <span>→</span></span></button>)}</div><div className="adventure-demo-footer"><span>{alreadyActed ? 'Daily lock is stored on the survivor token, including after a transfer.' : 'Preview values come from the frozen local contract. Confirmation requests one local wallet transaction.'}</span><button className="adventure-chain-action" disabled>{alreadyActed ? 'Acted today' : mayAct ? 'Choose an action' : 'Action unavailable'}</button></div></section>
    {choice !== undefined && eventIndex !== undefined && <LocalResult eventIndex={eventIndex} choiceIndex={choice} preview={contractPreview} state={txState} onConfirm={() => void confirm()} onClose={() => { if (txState !== 'confirming' && txState !== 'submitted') { setChoice(undefined); setTxState('ready') } }}/>} 
  </section>
}
