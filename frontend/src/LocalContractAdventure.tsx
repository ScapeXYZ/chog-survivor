import {MainnetRiskNotice} from './MainnetRiskNotice'
import {useEffect, useRef, useState} from 'react'
import {usePublicClient, useReadContract, useWriteContract} from 'wagmi'
import {decodeEventLog, getAddress, keccak256} from 'viem'
import {activeChain, approvedGameAddress, CHOG_GENESIS, gameLocalWriteAbi, gameReadAbi, LOCAL_CHAIN_ID, localMode, mainnetMode, mainnetTransactionsEnabled, contractMode, nftAbi} from './contracts'
import {mainnetDeployment} from './mainnetDeployment'
import {achievements, events, titles} from './game-data'
import {shortAddress, signed} from './utils'
import {survivorReadFreshness, useSurvivorIdentity} from './useSurvivorIdentity'
import wildEnvironment from './assets/ruined-wild-environment-provisional.webp'
import fogOverlay from './assets/moonlit-fog-overlay-provisional.webp'
import {emitGameSound, emitTransactionResult} from './audio'
import {NewOwnerNotice, type AdventureNavigation} from './NewOwnerNotice'
import {achievementEarnedEvent, adventureResolvedEvent, type AdventureHistory} from './survivalHistory'
import {ConfirmedSurvivorReaction} from './ConfirmedSurvivorReaction'
import {MiniGamePanel} from './MiniGamePanel'
import {useAdventureAvailability} from './useAdventureAvailability'
import {miniGameData} from './mini-game-data'
import {useAdventureDialog} from './useAdventureDialog'
import {previewMatchesSession, samePreview, type AdventureSession, type ContractPreview} from './adventureSession'

type TxState = 'confirming' | 'submitted' | 'confirmed' | 'confirmed-refresh-failed' | 'rejected' | 'failed'
type ConfirmedOutcome = Pick<AdventureHistory, 'tokenId' | 'owner' | 'day' | 'eventId' | 'choiceId' | 'outcomeId' | 'xpDelta' | 'trustDelta' | 'scarsDelta' | 'xpAfter' | 'trustAfter' | 'scarsAfter' | 'achievementMaskAfter'>
type Transaction = {id: number; session: AdventureSession; state: TxState; hash?: `0x${string}`; result?: ConfirmedOutcome; earnedAchievementIds?: number[]; timestamp?: bigint; message?: string}

function LocalResult({session, preview, transaction, onClose, onConfirm, onPreview}: {session: AdventureSession; preview?: ContractPreview; transaction?: Transaction; onClose: () => void; onConfirm: () => void; onPreview: () => void}) {
  const stage = transaction?.state ?? session.stage
  const dialog = useAdventureDialog(stage)
  const result = transaction?.result
  const event = events[result ? result.eventId - 1 : session.eventIndex]
  const displayChoiceIndex = result ? result.choiceId - 1 : session.choiceIndex
  const pending = transaction?.state === 'confirming' || transaction?.state === 'submitted'
  return <dialog ref={dialog} className={`adventure-result adventure-result-${event.tags[displayChoiceIndex]}${event.tags[displayChoiceIndex] === 'cautious' && stage === 'interaction' ? ' adventure-result-trial' : ''}`} aria-labelledby="local-preview-title" aria-describedby="local-preview-disclosure" onCancel={(e) => { e.preventDefault(); if (!pending) onClose() }}>
    <div className="adventure-result-heading"><div className="adventure-result-stamp" aria-hidden="true"><i/><i/></div><div><p className="adventure-result-encounter">{event.name}</p><p className="adventure-eyebrow">{result ? 'CONFIRMED ON-CHAIN MEMORY' : (mainnetMode ? 'MONAD MAINNET CONTRACT PREVIEW · MON GAS REQUIRED' : 'LOCAL CONTRACT PREVIEW')}</p></div></div>
    <h2 id="local-preview-title">{event.choices[displayChoiceIndex]}</h2>
    <p id="local-preview-disclosure" className="adventure-result-disclosure">CHOG #{session.tokenId.toString()} · Interactions do not affect rewards. Only a successful contract transaction records progression.</p>
    {stage === 'interaction' ? <MiniGamePanel tokenId={session.tokenId} config={miniGameData[event.name].choices[session.choiceIndex].interaction} onComplete={onPreview} onSkip={onPreview}/> : <>
      {!transaction && (preview ? <><p className="adventure-result-label">Authoritative contract preview · projected outcome {preview.outcomeId}</p><dl className="adventure-result-rewards"><div><dt>XP</dt><dd>{signed(preview.xpDelta)}</dd></div><div><dt>Trust</dt><dd>{signed(preview.trustDelta)}</dd></div><div><dt>Scars</dt><dd>{signed(preview.scarsDelta)}</dd></div></dl><p className="adventure-result-disclosure">Projected after action: {preview.xpAfter} XP · {preview.trustAfter}/100 Trust · {preview.scarsAfter}/100 Scars. This preview is not a confirmed result.</p></> : <p className="adventure-result-disclosure" role="status">A fresh matching contract preview is unavailable. Wait for verification or reopen the choice.</p>)}
      {!transaction && <><p className="adventure-result-disclosure">The contract uses the UTC day when the transaction executes. Confirming across a daily reset may resolve the new day’s encounter.</p><button className="adventure-return-choice" disabled={!preview?.canAct} onClick={onConfirm}>{preview?.canAct ? (mainnetMode ? 'CONFIRM MONAD MAINNET ACTION · MON GAS' : 'CONFIRM LOCAL ACTION') : 'DAILY ACTION UNAVAILABLE'}</button></>}
      {transaction?.state === 'confirming' && <p className="adventure-result-disclosure" role="status">Verifying current ownership and preview, then awaiting wallet confirmation…</p>}
      {transaction?.state === 'submitted' && <p className="adventure-result-disclosure" role="status">Transaction submitted. Waiting for {mainnetMode ? 'Monad mainnet' : 'Anvil'} confirmation…</p>}
      {transaction?.state === 'confirmed' && <p className="adventure-result-disclosure" role="status">Confirmed on {mainnetMode ? 'Monad mainnet' : 'local Anvil'}. Authoritative survivor reads were refreshed.</p>}
      {transaction?.state === 'confirmed-refresh-failed' && <p className="adventure-result-disclosure" role="status">Transaction confirmed on {mainnetMode ? 'Monad mainnet' : 'local Anvil'}, but refreshed survivor reads or verified outcome evidence are temporarily unavailable.</p>}
      {result && <><ConfirmedSurvivorReaction outcome={result} earnedAchievementIds={transaction?.earnedAchievementIds ?? []} timestamp={transaction?.timestamp}/><p className="adventure-result-label">Verified on-chain outcome {result.outcomeId} · UTC day {result.day.toString()}</p>{result.day !== session.day && <p>The UTC day changed before execution. This is the encounter actually recorded by the contract.</p>}<p>{events[result.eventId - 1]?.name} · {events[result.eventId - 1]?.choices[result.choiceId - 1]}</p><dl className="adventure-result-rewards adventure-confirmed-rewards"><div className="adventure-reward-xp"><dt>XP</dt><dd>{signed(result.xpDelta)}</dd></div><div className="adventure-reward-trust"><dt>Trust</dt><dd>{signed(result.trustDelta)}</dd></div><div className="adventure-reward-scars"><dt>Scars</dt><dd>{signed(result.scarsDelta)}</dd></div></dl><p>Recorded state: {result.xpAfter} XP · {result.trustAfter}/100 Trust · {result.scarsAfter}/100 Scars.</p><p>Recorded achievements: {achievements.filter((_, index) => (result.achievementMaskAfter & (1n << BigInt(index))) !== 0n).join(', ') || 'None'}.</p></>}
      {(transaction?.state === 'rejected' || transaction?.state === 'failed') && <p className="adventure-result-disclosure" role="status">{transaction.state === 'rejected' ? 'Wallet rejected the request.' : transaction.message ?? 'Transaction failed or reverted. No confirmed survivor update is shown.'}</p>}
      {transaction?.hash && <p className="adventure-result-disclosure">{mainnetMode ? 'Monad mainnet transaction' : 'Local transaction'}: <code>{transaction.hash.slice(0, 10)}…{transaction.hash.slice(-8)}</code>{mainnetMode && <a href={`https://monadscan.com/tx/${transaction.hash}`} target="_blank" rel="noopener noreferrer"> View submitted transaction on MonadScan</a>}</p>}
    </>}
    {!pending && <button className="adventure-return-choice" onClick={onClose}>{transaction ? 'RETURN TO ADVENTURE' : 'CANCEL'}</button>}
  </dialog>
}

export function LocalContractAdventure({selectedToken, onHome, onCharacter, onFindChogs, onHistory}: {selectedToken?: bigint; onHome: () => void} & AdventureNavigation) {
  const identity = useSurvivorIdentity(selectedToken)
  const client = usePublicClient({chainId: activeChain.id})
  const {writeContractAsync} = useWriteContract()
  const [session, setSession] = useState<AdventureSession>()
  // Transaction lifecycle outlives disposable interactions and is pinned to its origin.
  const [transaction, setTransaction] = useState<Transaction>()
  const submitting = useRef(false)
  const attemptId = useRef(0)
  const mounted = useRef(true)
  const lockWasAnnounced = useRef<boolean | undefined>(undefined)
  const identitySignature = `${identity.contextKey}:${identity.owner.data ?? 'unverified'}`
  const context = useRef({signature: identitySignature, epoch: 0})
  if (context.current.signature !== identitySignature) context.current = {signature: identitySignature, epoch: context.current.epoch + 1}
  const epoch = context.current.epoch
  const scopeKey = identity.scopeKey
  const safeBase = identity.verified && approvedGameAddress !== undefined
  const binding = useReadContract({address: approvedGameAddress, abi: gameReadAbi, functionName: 'CHOG_GENESIS', chainId: activeChain.id, scopeKey, query: {...survivorReadFreshness, enabled: safeBase}})
  const bound = safeBase && !binding.isLoading && !binding.isFetching && !binding.isError && binding.data?.toLowerCase() === CHOG_GENESIS.toLowerCase()
  const character = useReadContract({address: approvedGameAddress, abi: gameReadAbi, functionName: 'characterOf', args: selectedToken === undefined ? undefined : [selectedToken], chainId: activeChain.id, scopeKey, query: {...survivorReadFreshness, enabled: bound}})
  const title = useReadContract({address: approvedGameAddress, abi: gameReadAbi, functionName: 'titleOf', args: selectedToken === undefined ? undefined : [selectedToken], chainId: activeChain.id, scopeKey, query: {...survivorReadFreshness, enabled: bound}})
  const availability = useAdventureAvailability({client, tokenId: selectedToken, account: identity.address, expectedOwner: identity.owner.data,
    contextKey: `${identitySignature}:${epoch}`,
    // The reader independently verifies owner and binding. Background query
    // refetch flags must not cancel the receipt-triggered availability refresh.
    enabled: contractMode && identity.enabled && !identity.owner.isError && identity.owner.data !== undefined})
  const day = availability.snapshot?.day
  const currentSession = session?.epoch === epoch && session.day === day ? session : undefined
  const preview = useReadContract({address: approvedGameAddress, abi: gameReadAbi, functionName: 'preview', args: currentSession ? [currentSession.tokenId, currentSession.choiceIndex + 1] : undefined, chainId: activeChain.id,
    scopeKey: `${scopeKey}:preview:${currentSession?.epoch}:${currentSession?.day}:${currentSession?.eventIndex}:${currentSession?.choiceIndex}`,
    query: {...survivorReadFreshness, enabled: bound && identity.controls && currentSession?.stage === 'preview'}})

  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  useEffect(() => { setSession(undefined) }, [epoch, day])

  const state = bound && !character.isError && !character.isLoading && !character.isFetching ? character.data : undefined
  const eventIndex = availability.snapshot === undefined ? undefined : availability.snapshot.eventId - 1
  const event = eventIndex === undefined ? undefined : events[eventIndex]
  const alreadyActed = availability.snapshot?.preview?.canAct === false
  useEffect(() => {
    if (lockWasAnnounced.current === false && alreadyActed) emitGameSound('daily-lock')
    lockWasAnnounced.current = alreadyActed
  }, [alreadyActed])
  const readsReady = state !== undefined && availability.snapshot?.preview !== undefined && !availability.loading && !availability.error
  const mayAct = contractMode && (localMode ? activeChain.id === LOCAL_CHAIN_ID : mainnetMode && mainnetTransactionsEnabled && activeChain.id === 143) && bound && identity.controls && readsReady && !alreadyActed && event !== undefined && day !== undefined
  const titleName = bound && !title.isError && !title.isFetching && !title.isLoading && title.data !== undefined ? titles[Number(title.data)] : 'Unavailable'
  const candidate = preview.data as ContractPreview | undefined
  const contractPreview = currentSession?.stage === 'preview' && mayAct && !preview.isLoading && !preview.isFetching && !preview.isError && previewMatchesSession(candidate, currentSession) && candidate.eventId === availability.snapshot?.eventId ? candidate : undefined
  const pending = transaction?.state === 'confirming' || transaction?.state === 'submitted'

  async function confirm() {
    if (!mayAct || !currentSession || currentSession.stage !== 'preview' || submitting.current || !client || !approvedGameAddress || !contractPreview?.canAct) return
    submitting.current = true
    const origin = currentSession
    const id = ++attemptId.current
    const update = (change: Partial<Transaction>) => { if (mounted.current) setTransaction(current => current?.id === id ? {...current, ...change} : current) }
    setTransaction({id, session: origin, state: 'confirming'})
    setSession(undefined)
    try {
      const block = await client.getBlock()
      if (block.number === null) throw new Error('Latest chain block is unavailable.')
      const [chainId, bindingNow, ownerNow, previewNow] = await Promise.all([
        client.getChainId(),
        client.readContract({address: approvedGameAddress, abi: gameReadAbi, functionName: 'CHOG_GENESIS', blockNumber: block.number}),
        client.readContract({address: CHOG_GENESIS, abi: nftAbi, functionName: 'ownerOf', args: [origin.tokenId], blockNumber: block.number}),
        client.readContract({address: approvedGameAddress, abi: gameReadAbi, functionName: 'preview', args: [origin.tokenId, origin.choiceIndex + 1], blockNumber: block.number}),
      ])
      if (mainnetMode) {
        const code = await client.getCode({address: approvedGameAddress, blockNumber: block.number})
        if (!code || !mainnetDeployment || keccak256(code) !== mainnetDeployment.runtimeCodeHash) throw new Error('Game runtime does not match the approved deployment.')
      }
      const latest = await client.getBlock()
      if (!mounted.current || (localMode && (latest.number !== block.number || latest.hash !== block.hash)) || latest.timestamp / 86_400n !== origin.day || chainId !== activeChain.id || getAddress(bindingNow) !== getAddress(CHOG_GENESIS) || context.current.epoch !== origin.epoch || getAddress(ownerNow) !== getAddress(origin.address) || block.timestamp / 86_400n !== origin.day || !previewMatchesSession(previewNow, origin) || !previewNow.canAct || !samePreview(contractPreview, previewNow)) throw new Error('Ownership, day or preview changed. Reopen the choice to review a fresh preview.')
      // Estimate and simulate without signing. The wallet shows the actual fee request.
      const prepared = mainnetMode ? await client.simulateContract({address: approvedGameAddress, abi: gameLocalWriteAbi, functionName: 'act', args: [origin.tokenId, origin.choiceIndex + 1], account: origin.address}) : undefined
      const gas = mainnetMode ? await client.estimateContractGas({address: approvedGameAddress, abi: gameLocalWriteAbi, functionName: 'act', args: [origin.tokenId, origin.choiceIndex + 1], account: origin.address}) : undefined
      if (!mounted.current || context.current.epoch !== origin.epoch) throw new Error('Wallet or survivor changed. Reopen the preview.')
      if (mainnetMode && !prepared) throw new Error('Mainnet simulation unavailable.')
      const hash = await writeContractAsync({address: approvedGameAddress, abi: gameLocalWriteAbi, functionName: 'act', args: [origin.tokenId, origin.choiceIndex + 1], account: origin.address, chainId: activeChain.id, ...(gas === undefined ? {} : {gas})})
      update({hash, state: 'submitted'})
      const receipt = await client.waitForTransactionReceipt({hash, confirmations: mainnetMode ? 3 : 1, timeout: 120_000})
      if (mainnetMode) {
        const finalized = await client.getBlock({blockTag: 'finalized'})
        const included = await client.getBlock({blockNumber: receipt.blockNumber})
        if (finalized.number === null || finalized.number < receipt.blockNumber || included.hash !== receipt.blockHash) throw new Error('Receipt is not yet verified on the finalized canonical chain. Check the submitted hash before retrying.')
      }
      if (receipt.status !== 'success') throw new Error('Transaction failed or reverted. No confirmed survivor update is shown.')
      let result: ConfirmedOutcome | undefined
      const earnedEvents: {achievementId: number; day: bigint}[] = []
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() !== approvedGameAddress.toLowerCase()) continue
        try {
          const decoded = decodeEventLog({abi: [adventureResolvedEvent, achievementEarnedEvent], data: log.data, topics: log.topics, strict: true})
          if (decoded.args.tokenId !== origin.tokenId) continue
          if (decoded.eventName === 'AdventureResolved' && decoded.args.owner.toLowerCase() === origin.address.toLowerCase() && decoded.args.choiceId === origin.choiceIndex + 1 && decoded.args.day >= origin.day && (decoded.args.day !== origin.day || decoded.args.eventId === origin.eventIndex + 1) && decoded.args.eventId >= 1 && decoded.args.eventId <= events.length && decoded.args.outcomeId === (decoded.args.eventId - 1) * 3 + decoded.args.choiceId) result = decoded.args
          if (decoded.eventName === 'AchievementEarned') earnedEvents.push({achievementId: decoded.args.achievementId, day: decoded.args.day})
        } catch { /* Unrelated or malformed logs do not establish an outcome. */ }
      }
      const earnedAchievementIds = result ? [...new Set(earnedEvents.filter(earned => earned.day === result!.day && earned.achievementId < achievements.length && (result!.achievementMaskAfter & (1n << BigInt(earned.achievementId))) !== 0n).map(earned => earned.achievementId))] : []
      let timestamp: bigint | undefined
      if (result && receipt.blockNumber !== undefined) {
        try {
          const confirmedBlock = await client.getBlock({blockNumber: receipt.blockNumber})
          if (confirmedBlock.number === receipt.blockNumber && (!receipt.blockHash || receipt.blockHash === confirmedBlock.hash)) timestamp = confirmedBlock.timestamp / 86_400n === result.day ? confirmedBlock.timestamp : undefined
        } catch { /* A missing timestamp never substitutes device time or discards a verified receipt. */ }
      }
      const sameContext = mounted.current && context.current.epoch === origin.epoch
      if (sameContext) emitTransactionResult(true, earnedAchievementIds.length > 0 ? 1n : 0n)
      // Refresh only the originating context. A receipt must never update a different survivor's UI.
      const refreshed = sameContext ? await Promise.allSettled([identity.owner.refetch(), binding.refetch(), character.refetch(), title.refetch(), availability.refresh({minimumBlock: receipt.blockNumber, invalidate: true})]) : []
      window.dispatchEvent(new Event('chog-local-history-refresh'))
      update({result, earnedAchievementIds, timestamp, state: !result || refreshed.some(query => query.status === 'rejected' || query.value === false || (typeof query.value === 'object' && query.value.isError)) ? 'confirmed-refresh-failed' : 'confirmed'})
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Transaction failed. No confirmed survivor update is shown.'
      const rejected = /reject|denied/i.test(message) || (error as {code?: number})?.code === 4001
      update({state: rejected ? 'rejected' : 'failed', message: `${message}${mainnetMode ? ' If a hash was submitted, check it on MonadScan before retrying; a timeout does not prove failure.' : ''}`})
      if (mounted.current && context.current.epoch === origin.epoch) emitTransactionResult(false)
    } finally { submitting.current = false }
  }

  const visibleTransaction = transaction?.session.epoch === epoch ? transaction : undefined
  const dialogSession = visibleTransaction?.session ?? currentSession
  const status = !identity.connected ? (mainnetMode ? 'Connect a Monad wallet to play. Browsing and simulation remain walletless.' : 'Connect a local Anvil wallet to play.') : !identity.onMonad ? (mainnetMode ? 'Select Monad mainnet chain 143 in your wallet.' : 'Switch to Local Anvil chain 31338.') : !identity.verified ? identity.ownershipMessage : !bound ? 'Verifying the frozen game binding…' : !identity.controls ? 'Another wallet controls this survivor.' : availability.error ? 'Current chain-day eligibility is unavailable. Refresh ownership to retry.' : alreadyActed ? (mainnetMode ? 'This survivor has already acted for the current Monad mainnet UTC day.' : 'This survivor has already acted for the current local-chain UTC day.') : !availability.snapshot || availability.loading ? 'Verifying current chain-day eligibility…' : (mainnetMode ? 'Ready for one Monad mainnet action. Wallet confirmation and MON gas required; no NFT approval.' : 'Ready for one local contract-backed action.')
  const hud = state
  return <section className="adventure-game" aria-labelledby="adventure-title">
    <header className="adventure-hud"><div className="adventure-brand"><span className="adventure-emblem">CS</span><div><strong>CHOG SURVIVOR</strong><span className="adventure-demo-badge">{mainnetMode ? 'MONAD MAINNET · REAL TRANSACTIONS' : 'LOCAL CONTRACT TEST · NOT MONAD MAINNET'}</span></div></div><div className="adventure-stat-group"><span className="adventure-stat-disclosure">ONCHAIN SURVIVOR STATE</span><dl className="adventure-stats" aria-label="Contract-backed character statistics"><div><dt>XP</dt><dd>{hud?.xp ?? 'Unavailable'}</dd></div><div><dt>Trust</dt><dd>{hud ? `${hud.trust}` : 'Unavailable'}<small>/100</small></dd></div><div><dt>Scars</dt><dd>{hud ? `${hud.scars}` : 'Unavailable'}<small>/100</small></dd></div><div><dt>Streak</dt><dd>{hud?.streak ?? 'Unavailable'}<small> days</small></dd></div></dl></div><button className="adventure-home" onClick={onHome}>← Back to Home</button></header>
    {mainnetMode && <MainnetRiskNotice className="adventure-result-disclosure"/>}
    <aside className="adventure-survivor">{identity.verified && !identity.controls ? <NewOwnerNotice tokenId={selectedToken!} onFindChogs={onFindChogs} onHistory={onHistory ?? onCharacter}/> : <div role="status" aria-live="polite"><span className="adventure-survivor-label">{mainnetMode ? 'GENUINE CHOG GENESIS · CURRENT OWNER REQUIRED' : 'LOCAL TEST FIXTURE — NOT CHOG GENESIS'}</span><strong>{identity.verified ? `CHOG #${selectedToken}` : selectedToken === undefined ? 'No survivor selected' : `Requested token #${selectedToken}`}</strong><p>{status}{identity.verified && <span> Owner: {shortAddress(identity.owner.data)}.</span>}</p></div>}<p className="adventure-survivor-disclosure">Encounter day: {day === undefined ? 'reading chain…' : `UTC day ${day}`}. Title: {titleName}.</p><div className="adventure-survivor-actions">{identity.controls && onCharacter && <button onClick={onCharacter}>View survivor profile →</button>}<button disabled={!identity.enabled} onClick={() => { void identity.owner.refetch(); void availability.refresh() }}>Refresh ownership</button></div></aside>
    <div className="adventure-stage"><div className="adventure-world" role="img" aria-label="Moonlit forest with ruined stone gateways"><img className="adventure-environment" src={wildEnvironment} alt=""/><div className="adventure-scene-wash"/><img className="adventure-mist adventure-mist-back" src={fogOverlay} alt=""/><img className="adventure-mist" src={fogOverlay} alt=""/></div><div className="adventure-scene-heading"><div className="adventure-encounter-seal" data-encounter={(eventIndex ?? 0) + 1}><i/><i/><i/></div><div><p className="adventure-eyebrow">AUTHORITATIVE DAILY ENCOUNTER · {eventIndex === undefined ? 'READING' : `EVENT ${String(eventIndex + 1).padStart(2, '0')} / 06`}</p><h1 id="adventure-title">{event?.name ?? 'Reading the wild…'}</h1><p className="adventure-scene-motto">Every choice leaves a mark.</p></div></div><div className="adventure-trail-tag"><span className="adventure-eyebrow">{mainnetMode ? 'MONAD MAINNET TRAIL' : 'LOCAL CHAIN TRAIL'}</span><strong>{titleName}</strong><span>Token-bound progression · read only until you confirm</span></div></div>
    <section className="adventure-controls"><div className="adventure-story"><div><p className="adventure-eyebrow">YOUR NEXT MOVE</p><h2>How will you survive?</h2></div><p>{event?.narrative ?? 'The contract determines the encounter before choices become available.'}</p></div><div className="adventure-choices">{(event?.choices ?? []).map((name, index) => <button key={name} disabled={!mayAct || pending} className={`adventure-choice adventure-choice-${event!.tags[index]}`} onClick={() => { if (!mayAct || submitting.current || selectedToken === undefined || !identity.address || day === undefined || eventIndex === undefined) return; emitGameSound('choice'); setTransaction(undefined); setSession({epoch, tokenId: selectedToken, address: identity.address, day, eventIndex, choiceIndex: index, stage: 'interaction'}) }}><span className="adventure-choice-top"><span className="adventure-choice-number">0{index + 1}</span><span className="adventure-choice-category">{event!.tags[index]}</span></span><strong>{name}</strong><span className="adventure-choice-action">Preview contract result <span>→</span></span></button>)}</div><div className="adventure-demo-footer"><span>{alreadyActed ? 'Daily lock is stored on the survivor token, including after a transfer.' : (mainnetMode ? 'Preview from the frozen contract. Confirmation requests one Monad mainnet transaction with MON gas. No NFT approval or transfer.' : 'Preview values come from the frozen local contract. Confirmation requests one local wallet transaction.')}</span><button className="adventure-chain-action" disabled>{alreadyActed ? 'Acted today' : mayAct ? 'Choose an action' : 'Action unavailable'}</button></div></section>
    {transaction && (!visibleTransaction || !identity.controls || !bound) && <p className="adventure-result-disclosure" role="status">Transaction for CHOG #{transaction.session.tokenId.toString()}: {transaction.state}. {transaction.hash && <code>{transaction.hash.slice(0, 10)}…{transaction.hash.slice(-8)}</code>} Its result belongs to that survivor.</p>}
    {identity.controls && bound && dialogSession && <LocalResult
      key={`${dialogSession.epoch}:${dialogSession.day}:${dialogSession.eventIndex}:${dialogSession.choiceIndex}`}
      session={dialogSession} preview={contractPreview} transaction={visibleTransaction}
      onPreview={() => setSession(current => current?.epoch === epoch && current.day === day ? {...current, stage: 'preview'} : undefined)}
      onConfirm={() => void confirm()}
      onClose={() => { if (!submitting.current) { setSession(undefined); setTransaction(undefined) } }}/>
    }
  </section>
}
