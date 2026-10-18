import {useEffect, useRef, useState} from 'react'
import {usePublicClient, useWalletClient} from 'wagmi'
import {formatEther, formatGwei, type Hex} from 'viem'
import {mainnetTransactionsEnabled} from './contracts'
import {useSurvivorProgress} from './useSurvivorProgress'
import {useAdventureAvailability} from './useAdventureAvailability'
import {useNftMetadata} from './useNftMetadata'
import {events, titles, achievements} from './game-data'
import {MainnetRiskNotice} from './MainnetRiskNotice'
import {DailyTrailGuide} from './DailyTrailGuide'
import {useAdventureDialog} from './useAdventureDialog'
import {GAME, gameplayPolicy, isBlocking, journalKey, loadAction, prepareAction, reconcileAction, submitAction, type Intent, type Quote, type PendingAction, type ConfirmedAction} from './mainnetGameplay'

function Review({intent, quote, preparing, error, busy, eligible, confirm, close}: {intent: Intent; quote?: Quote; preparing: boolean; error: string; busy: boolean; eligible: boolean; confirm: () => void; close: () => void}) {
  const dialog = useAdventureDialog(preparing ? 'preparing' : busy ? 'pending' : 'review')
  const [accepted, setAccepted] = useState(false)
  return <dialog ref={dialog} className="adventure-result mainnet-review" aria-labelledby="mainnet-review-title" onCancel={event => {event.preventDefault(); if (!busy) close()}}>
    <h2 id="mainnet-review-title">Review real Monad action</h2>
    <p>MAINNET · REAL MON GAS</p><MainnetRiskNotice/>
    <dl><dt>Wallet</dt><dd>{intent.account}</dd><dt>Selected NFT</dt><dd>CHOG #{intent.tokenId.toString()}</dd><dt>Network</dt><dd>Monad mainnet · 143</dd><dt>Contract</dt><dd>{GAME}</dd><dt>Function and arguments</dt><dd>act({intent.tokenId.toString()}, {intent.choiceId})</dd><dt>Transaction value</dt><dd>0 MON · no NFT approval or transfer</dd></dl>
    <p>Safety limits: 400,000 gas · 125 gwei total fee per gas · 0.05 MON maximum cost · 0.1 MON minimum reserve.</p>
    {preparing && <p role="status">Verifying current ownership, runtime, eligibility, simulation and fees. No wallet confirmation is requested.</p>}
    {error && <p role="alert">{error}</p>}
    {!quote && <p>Estimated fees: Unavailable until preflight completes. Submission is disabled. Cancel this review to retry after resolving the error.</p>}
    {quote && <><dl><dt>Calldata</dt><dd><code>{quote.data}</code></dd><dt>Pending nonce</dt><dd>{quote.nonce}</dd><dt>Estimated gas / limit</dt><dd>{quote.estimatedGas.toString()} / {quote.gas.toString()}</dd><dt>Maximum fee / priority per gas</dt><dd>{formatGwei(quote.maxFeePerGas)} / {formatGwei(quote.maxPriorityFeePerGas)} gwei</dd><dt>Maximum potential cost</dt><dd>{formatEther(quote.maxCost)} MON</dd><dt>Minimum reserve / expected reserve at maximum cost</dt><dd>{formatEther(gameplayPolicy.reserve)} / {formatEther(quote.balance - quote.maxCost)} MON</dd></dl>
    <p>Contract projection, not a result: {quote.preview.xpAfter} XP · {quote.preview.trustAfter} Trust · {quote.preview.scarsAfter} Scars · streak {quote.preview.streakAfter}. Title: {titles[quote.preview.titleId] ?? 'Unavailable'}. No outcome is recorded until the receipt and corresponding state are verified.</p></>}
    <p>The transaction executes the encounter for its inclusion day. A delayed wallet approval across 00:00 UTC can change the encounter and outcome. Quotes expire after 60 seconds before requesting the wallet; never bypass a wallet warning or manually increase these fee limits.</p>
    {busy && <p>Reject or cancel in your wallet to stop before submission. Refreshing the page does not cancel a submitted transaction.</p>}
    <label><input type="checkbox" checked={accepted} disabled={!quote || busy || !eligible} onChange={event => setAccepted(event.target.checked)}/>I reviewed this exact action, maximum cost and day-change risk.</label>
    <button className="adventure-return-choice" disabled={!quote || !accepted || busy || !eligible} onClick={confirm}>{busy ? 'Awaiting wallet or confirmation…' : 'Request wallet confirmation'}</button>
    <button className="adventure-return-choice" disabled={busy} onClick={close}>Cancel review</button>
  </dialog>
}

// Separate component is unreachable while the source-level production gate is false.
// Tests replace dependencies at module boundaries, never via a public URL/storage switch.
export function MainnetGameplayPanel({selectedToken}: {selectedToken?: bigint}) {
  const progress = useSurvivorProgress(selectedToken)
  const {identity} = progress
  const client = usePublicClient({chainId: 143})
  const {data: wallet} = useWalletClient({chainId: 143})
  const availability = useAdventureAvailability({client, tokenId: selectedToken, account: identity.address, expectedOwner: identity.owner.data, contextKey: identity.contextKey, enabled: progress.bound && identity.controls})
  const metadata = useNftMetadata(selectedToken, identity.verified, identity.scopeKey)
  const [quote, setQuote] = useState<Quote>()
  const [reviewIntent, setReviewIntent] = useState<Intent>()
  const [reviewError, setReviewError] = useState('')
  const [preparing, setPreparing] = useState(false)
  const reviewGeneration = useRef(0)
  const [record, setRecord] = useState<PendingAction>()
  const [result, setResult] = useState<ConfirmedAction>()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [storageError, setStorageError] = useState(false)
  const [recoverHash, setRecoverHash] = useState('')
  const operation = useRef(false)
  const mounted = useRef(true)
  const context = useRef('')
  context.current = identity.contextKey + ':' + identity.owner.data + ':' + identity.controls
  const refreshJournal = () => {try {setRecord(loadAction(localStorage));setStorageError(false)} catch {setStorageError(true);setMessage('Pending tracking unavailable or corrupted. Submission is blocked; inspect wallet activity before recovery.')}}
  useEffect(() => {
    mounted.current = true; refreshJournal()
    const listener = (event: StorageEvent) => {if (event.key === journalKey || event.key === null) refreshJournal()}
    window.addEventListener('storage', listener)
    return () => {mounted.current = false; window.removeEventListener('storage', listener)}
  }, [])
  const ownsVerified = identity.connected && identity.onMonad && identity.verified && identity.controls && progress.bound
  // Revalidation must invalidate consent without silently dismissing the review.
  useEffect(() => {
    setQuote(undefined);setResult(undefined)
    if (reviewIntent) {
      ++reviewGeneration.current
      setReviewError('Wallet, token or verification changed. Cancel and Retry after ownership and mainnet checks complete.')
      if (preparing) {operation.current = false;setBusy(false);setPreparing(false)}
    }
  }, [identity.contextKey, ownsVerified])
  const blocked = busy || storageError || isBlocking(record)
  const canReview = mainnetTransactionsEnabled && ownsVerified && !!progress.state && availability.snapshot?.preview?.canAct === true && !availability.loading && !availability.error && !blocked
  function closeReview() {
    ++reviewGeneration.current;setReviewIntent(undefined);setQuote(undefined);setReviewError('')
    if (preparing) {operation.current = false;setBusy(false);setPreparing(false)}
  }
  async function review(choiceId: number) {
    if (!canReview || !client || !identity.address || selectedToken === undefined || operation.current) return
    const intent = {account: identity.address, tokenId: selectedToken, choiceId}
    const run = ++reviewGeneration.current, origin = context.current
    operation.current = true;setBusy(true);setPreparing(true);setReviewIntent(intent);setQuote(undefined);setReviewError('');setMessage('');setResult(undefined)
    let timer: ReturnType<typeof setTimeout> | undefined
    const active = () => mounted.current && reviewGeneration.current === run
    try {
      // Only read-only work races this deadline. A late response cannot publish a quote or request a wallet.
      const prepared = await Promise.race([prepareAction(client, intent), new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(Error('Preflight timed out after 8 seconds. Check the RPC connection, cancel this review and Retry. No wallet request was made.')), 8000)
      })])
      if (active()) {
        if (context.current !== origin) throw Error('Wallet, token or verification changed. Cancel and Retry after ownership and mainnet checks complete.')
        setQuote(prepared)
      }
    } catch (error) {if (active()) setReviewError(error instanceof Error ? error.message : 'Preflight failed. Cancel and retry; no wallet request made.')}
    finally {clearTimeout(timer);if (active()) {operation.current = false;setBusy(false);setPreparing(false)}}
  }
  async function checkPending(hash?: Hex) {
    if (!client || operation.current) return
    operation.current = true;setBusy(true);setQuote(undefined);setMessage('Checking the original nonce, finalized receipt and recorded survivor state…')
    try {
      const checked = await reconcileAction(client, localStorage, hash)
      if (mounted.current) {
        setRecord(checked.record);setResult(checked.result);setMessage(checked.result ? 'Verified finalized receipt and matching on-chain state.' : checked.record.message ?? checked.record.phase)
        // Read-only refresh, scoped by each hook. A receipt never mutates a different token's stats.
        window.dispatchEvent(new Event('focus'));window.dispatchEvent(new Event('chog-local-history-refresh'))
        void availability.refresh({invalidate: true})
      }
    } catch (error) {if (mounted.current) setMessage(`Status uncertain: ${error instanceof Error ? error.message : 'RPC unavailable'}. No automatic retry; check the hash and wallet activity.`)}
    finally {operation.current = false;if (mounted.current) {setBusy(false);refreshJournal()}}
  }
  async function confirm() {
    if (!quote || !client || !wallet || !canReview || operation.current || !mainnetTransactionsEnabled) return
    if (!navigator.locks) {setMessage('Exclusive browser transaction locking unavailable. Submission is blocked.');return}
    operation.current = true;setBusy(true)
    const origin = context.current
    try {
      const submitted = await navigator.locks.request('chog-mainnet-action', {ifAvailable: true}, async lock => {
        if (!lock) throw Error('Another tab is handling an action. Do not submit twice.')
        return submitAction(client, wallet, quote, localStorage, () => mounted.current && context.current === origin)
      })
      setQuote(undefined);setReviewIntent(undefined);refreshJournal();setMessage(`Submitted ${submitted.hash}. Awaiting verified confirmation.`)
      operation.current = false
      await checkPending()
    } catch (error) {if (mounted.current) {setQuote(undefined);setReviewIntent(undefined);refreshJournal();setMessage(error instanceof Error ? error.message : 'Wallet response uncertain; check pending status')}}
    finally {operation.current = false;if (mounted.current) setBusy(false)}
  }
  const event = availability.snapshot ? events[availability.snapshot.eventId - 1] : undefined
  const originatingResult = result && result.tokenId === selectedToken ? result : undefined
  return <section className="mainnet-gameplay" aria-labelledby="gameplay-heading">
    <h2 id="gameplay-heading">{mainnetTransactionsEnabled ? 'One Chog. One daily decision.' : 'On-chain gameplay not yet enabled'}</h2>
    <p>One decision per Chog per UTC day. You pay MON gas only. No NFT approval.</p>
    <details><summary>Gameplay risks</summary><MainnetRiskNotice/></details>
    <DailyTrailGuide state={progress.state}/>
    {metadata.metadata?.name && <p>Collection metadata name: {metadata.metadata.name}</p>}
    <p role="status">{message || (!identity.controls ? identity.ownershipMessage : availability.error ? 'RPC unavailable. Retry ownership and eligibility reads.' : availability.loading ? 'Reading chain-day eligibility…' : availability.snapshot?.preview?.canAct === false ? 'Daily action already completed. Wait for the next UTC day; transferring the NFT does not reset the lock.' : canReview ? 'Action available. Choose a decision to review.' : 'Action unavailable. Verify the token and mainnet contract state.')}</p>
    <div className="adventure-choices">{ownsVerified && event?.choices.map((choice, index) => <button className={`adventure-choice adventure-choice-${event.tags[index]}`} key={choice} disabled={!canReview} onClick={() => void review(index + 1)}><strong>{choice}</strong><span>Review real contract action</span></button>)}</div>
    {record && <aside className="mainnet-pending" aria-label="Persistent transaction status"><p>Originating wallet {record.account} · CHOG #{record.tokenId} · nonce {record.nonce} · {record.phase}</p>{record.hash && <a target="_blank" rel="noopener noreferrer" href={`https://monadscan.com/tx/${record.hash}`}>{record.hash}</a>}{isBlocking(record) && <><p>Pending or uncertain submissions block another action across tokens, accounts and page refreshes. Checking status never requests a signature.</p><button disabled={busy} onClick={() => void checkPending()}>Check original transaction status</button><label>Recovery hash from wallet activity<input aria-label="Recovery transaction hash" value={recoverHash} onChange={event => setRecoverHash(event.target.value)}/></label><button disabled={busy || !/^0x[0-9a-fA-F]{64}$/.test(recoverHash)} onClick={() => void checkPending(recoverHash as Hex)}>Verify recovery hash</button></>}</aside>}
    {originatingResult && <aside aria-label="Verified transaction result"><h3>Confirmed on Monad</h3><p>CHOG #{originatingResult.tokenId.toString()} · UTC day {originatingResult.day.toString()} · {events[originatingResult.eventId - 1].name} · {events[originatingResult.eventId - 1].choices[originatingResult.choiceId - 1]}</p><p>{originatingResult.xp} XP · {originatingResult.trust} Trust · {originatingResult.scars} Scars · streak {originatingResult.streak} · {titles[originatingResult.titleId]}</p><p>Recorded achievements: {achievements.filter((_, index) => (originatingResult.achievementMask & (1n << BigInt(index))) !== 0n).join(', ') || 'None'}</p><p>Verified at block {originatingResult.block.toString()}. Current profile/history refresh independently; read errors never fabricate newer state.</p></aside>}
    {reviewIntent && <Review intent={reviewIntent} quote={ownsVerified ? quote : undefined} preparing={preparing} error={reviewError} busy={busy && !preparing} eligible={canReview} confirm={() => void confirm()} close={closeReview}/>}
  </section>
}
