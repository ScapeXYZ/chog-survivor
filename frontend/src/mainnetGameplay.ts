import {decodeEventLog, encodeFunctionData, isAddress, keccak256, type Address, type Hex, type PublicClient, type WalletClient} from 'viem'
import {CHOG_GENESIS, gameLocalWriteAbi, gameReadAbi, mainnetTransactionsEnabled, monad, nftAbi} from './contracts'
import {mainnetDeployment} from './mainnetDeployment'
import {verifiedCollectionCodeHash} from './discoverSurvivors'
import {previewMatchesSession, samePreview, type ContractPreview} from './adventureSession'
import {adventureResolvedEvent} from './survivalHistory'

// Owner-approved GAMEPLAY spending policy. Activation remains separately gated. No runtime overrides.
export const gameplayPolicy = Object.freeze({gasLimit: 400_000n, maxFeePerGas: 125_000_000_000n, maxCost: 50_000_000_000_000_000n, reserve: 100_000_000_000_000_000n, quoteMs: 60_000, resetGuardSeconds: 120n})
export const GAME = '0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390' as const
export const journalKey = 'chog:mainnet-action:v1'
export type GameplayClient = Pick<PublicClient, 'getChainId' | 'getBlock' | 'getCode' | 'readContract' | 'simulateContract' | 'estimateContractGas' | 'estimateFeesPerGas' | 'getBalance' | 'getTransactionCount' | 'getTransaction' | 'waitForTransactionReceipt'>
export type GameplayWallet = Pick<WalletClient, 'getAddresses' | 'getChainId' | 'sendTransaction' | 'account'>
export type Intent = {account: Address; tokenId: bigint; choiceId: number}
export type Quote = Intent & {data: Hex; preview: ContractPreview; nonce: number; block: bigint; estimatedGas: bigint; gas: bigint; maxFeePerGas: bigint; maxPriorityFeePerGas: bigint; maxCost: bigint; balance: bigint; createdAt: number}
export type PendingAction = {version: 1; chainId: 143; account: Address; tokenId: string; choiceId: number; nonce: number; day: string; data: Hex; hash?: Hex; phase: 'wallet' | 'pending' | 'uncertain' | 'confirmed' | 'reverted' | 'cancelled' | 'replaced' | 'rejected'; message?: string}
export type Journal = Pick<Storage, 'getItem' | 'setItem'>
export type ConfirmedAction = {hash: Hex; block: bigint; tokenId: bigint; day: bigint; eventId: number; choiceId: number; xp: number; trust: number; scars: number; streak: number; unmarkedStreak: number; achievementMask: bigint; titleId: number}
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()
const requireThat: (ok: unknown, message: string) => asserts ok = (ok, message) => {if (!ok) throw Error(message)}
export function calldata(tokenId: bigint, choiceId: number) {
  requireThat(typeof tokenId === 'bigint' && tokenId >= 0n && tokenId < 2n ** 256n && Number.isInteger(choiceId) && choiceId >= 1 && choiceId <= 3, 'Unsupported action: act requires a uint256 token and choice 1–3')
  return encodeFunctionData({abi: gameLocalWriteAbi, functionName: 'act', args: [tokenId, choiceId]})
}
export function isBlocking(record?: PendingAction) {return !!record && ['wallet', 'pending', 'uncertain'].includes(record.phase)}
export function loadAction(store: Journal): PendingAction | undefined {
  const raw = store.getItem(journalKey)
  if (!raw) return
  requireThat(raw.length <= 4096, 'Pending journal exceeds size limit')
  let r: PendingAction
  try {r = JSON.parse(raw)} catch {throw Error('Pending journal is unreadable. Resolve it before another action.')}
  requireThat(r && r.version === 1 && r.chainId === 143 && typeof r.account === 'string' && isAddress(r.account) && typeof r.tokenId === 'string' && /^\d+$/.test(r.tokenId) && typeof r.day === 'string' && /^\d+$/.test(r.day) && Number.isSafeInteger(r.nonce) && r.nonce >= 0 && ['wallet','pending','uncertain','confirmed','reverted','cancelled','replaced','rejected'].includes(r.phase) && (!r.hash || /^0x[0-9a-fA-F]{64}$/.test(r.hash)), 'Invalid pending journal. Resolve it before another action.')
  requireThat(r.data === calldata(BigInt(r.tokenId), r.choiceId), 'Pending calldata mismatch')
  return r
}
function save(store: Journal, record: PendingAction) {
  const raw = JSON.stringify(record)
  store.setItem(journalKey, raw)
  requireThat(store.getItem(journalKey) === raw, 'Durable pending tracking unavailable; do not submit')
}
export async function prepareAction(client: GameplayClient, intent: Intent): Promise<Quote> {
  const {account, tokenId, choiceId} = intent, data = calldata(tokenId, choiceId)
  requireThat(isAddress(account) && mainnetDeployment?.address === GAME && mainnetDeployment.chainId === 143, 'Approved deployment unavailable')
  const [chain, block] = await Promise.all([client.getChainId(), client.getBlock({blockTag: 'latest'})])
  requireThat(chain === 143 && block.number !== null && block.hash, 'Monad chain 143 required')
  const day = block.timestamp / 86400n
  requireThat(86400n - block.timestamp % 86400n > gameplayPolicy.resetGuardSeconds, 'Too close to UTC reset. Wait for the new encounter.')
  const [code, nftCode, binding, owner, candidate, nonce, latestNonce, balance, fees] = await Promise.all([
    client.getCode({address: GAME, blockNumber: block.number}), client.getCode({address: CHOG_GENESIS, blockNumber: block.number}),
    client.readContract({address: GAME, abi: gameReadAbi, functionName: 'CHOG_GENESIS', blockNumber: block.number}),
    client.readContract({address: CHOG_GENESIS, abi: nftAbi, functionName: 'ownerOf', args: [tokenId], blockNumber: block.number}),
    client.readContract({address: GAME, abi: gameReadAbi, functionName: 'preview', args: [tokenId, choiceId], blockNumber: block.number}),
    client.getTransactionCount({address: account, blockTag: 'pending'}), client.getTransactionCount({address: account, blockTag: 'latest'}),
    client.getBalance({address: account, blockNumber: block.number}), client.estimateFeesPerGas(),
  ])
  requireThat(code && keccak256(code) === mainnetDeployment.runtimeCodeHash && nftCode && keccak256(nftCode) === verifiedCollectionCodeHash && same(binding, CHOG_GENESIS), 'Runtime or NFT binding mismatch')
  requireThat(same(owner, account), 'Only the current NFT owner may act')
  requireThat(nonce === latestNonce && Number.isSafeInteger(nonce), 'Wallet has pending transactions or nonce is unavailable')
  requireThat(previewMatchesSession(candidate, {epoch: 0, address: account, tokenId, day, eventIndex: candidate.eventId - 1, choiceIndex: choiceId - 1, stage: 'preview'}) && candidate.eventId >= 1 && candidate.eventId <= 6 && candidate.canAct, 'Daily action unavailable or preview invalid')
  const request = {address: GAME, abi: gameLocalWriteAbi, functionName: 'act' as const, args: [tokenId, choiceId] as const, account}
  // Simulation executes in RPC memory. It never signs or broadcasts.
  await client.simulateContract({...request, blockNumber: block.number})
  const estimatedGas = await client.estimateContractGas(request)
  const gas = (estimatedGas * 125n + 99n) / 100n
  const {maxFeePerGas, maxPriorityFeePerGas} = fees
  requireThat(estimatedGas > 0n && gas <= gameplayPolicy.gasLimit && typeof maxFeePerGas === 'bigint' && typeof maxPriorityFeePerGas === 'bigint' && maxFeePerGas > 0n && maxPriorityFeePerGas >= 0n && maxPriorityFeePerGas <= maxFeePerGas && maxFeePerGas <= gameplayPolicy.maxFeePerGas, 'Gas/fee estimation unavailable or exceeds gameplay limits')
  const maxCost = gas * maxFeePerGas
  requireThat(maxCost <= gameplayPolicy.maxCost && balance >= maxCost + gameplayPolicy.reserve, 'Cost exceeds ceiling or leaves insufficient MON reserve')
  requireThat((await client.getBlock({blockNumber: block.number})).hash === block.hash, 'RPC canonical block changed')
  return {...intent, data, preview: candidate, nonce, block: block.number, estimatedGas, gas, maxFeePerGas, maxPriorityFeePerGas, maxCost, balance, createdAt: Date.now()}
}
async function walletMatches(wallet: GameplayWallet, account: Address) {
  const [chain, accounts] = await Promise.all([wallet.getChainId(), wallet.getAddresses()])
  requireThat(chain === 143 && accounts[0] && same(accounts[0], account) && wallet.account?.type !== 'local', 'Wallet account or network changed; reconnect and review')
}
function explicitlyRejected(error: unknown) {
  const seen = new Set<unknown>()
  while (error && typeof error === 'object' && !seen.has(error)) {seen.add(error); if ((error as {code?: number}).code === 4001) return true; error = (error as {cause?: unknown}).cause}
  return false
}
// Called inside an exclusive Web Lock by the UI. Gate is a source constant, never an argument or browser flag.
export async function submitAction(client: GameplayClient, wallet: GameplayWallet, quote: Quote, store: Journal, active: () => boolean): Promise<PendingAction> {
  requireThat(mainnetTransactionsEnabled, 'Mainnet gameplay release is not authorized')
  requireThat(!isBlocking(loadAction(store)), 'An unresolved action already exists; check its status, never retry blindly')
  requireThat(quote.gas > 0n && quote.gas <= gameplayPolicy.gasLimit && quote.maxFeePerGas > 0n && quote.maxFeePerGas <= gameplayPolicy.maxFeePerGas && quote.maxPriorityFeePerGas >= 0n && quote.maxPriorityFeePerGas <= quote.maxFeePerGas && quote.maxCost === quote.gas * quote.maxFeePerGas && quote.maxCost <= gameplayPolicy.maxCost, 'Reviewed spending fields exceed policy')
  requireThat(active() && Date.now() - quote.createdAt >= 0 && Date.now() - quote.createdAt < gameplayPolicy.quoteMs, 'Review expired or wallet/token changed')
  await walletMatches(wallet, quote.account)
  const fresh = await prepareAction(client, quote)
  requireThat(active() && fresh.nonce === quote.nonce && fresh.data === quote.data && samePreview(fresh.preview, quote.preview) && fresh.gas <= quote.gas && fresh.maxFeePerGas <= quote.maxFeePerGas && fresh.maxPriorityFeePerGas <= quote.maxPriorityFeePerGas && fresh.balance >= quote.maxCost + gameplayPolicy.reserve && Date.now() - quote.createdAt < gameplayPolicy.quoteMs, 'Ownership, nonce, day, costs or preview changed. Review again.')
  await walletMatches(wallet, quote.account)
  requireThat(active() && Date.now() - quote.createdAt < gameplayPolicy.quoteMs, 'Wallet/token changed or review expired before submission')
  let record: PendingAction = {version: 1, chainId: 143, account: quote.account, tokenId: quote.tokenId.toString(), choiceId: quote.choiceId, nonce: quote.nonce, day: quote.preview.day.toString(), data: quote.data, phase: 'wallet'}
  save(store, record) // Write-ahead record must survive a refresh while the wallet is open.
  try {
    const hash = await wallet.sendTransaction({account: quote.account, chain: monad, to: GAME, data: quote.data, value: 0n, gas: quote.gas, maxFeePerGas: quote.maxFeePerGas, maxPriorityFeePerGas: quote.maxPriorityFeePerGas, nonce: quote.nonce})
    record = {...record, hash, phase: 'pending'}; save(store, record); return record
  } catch (error) {
    record = {...record, phase: explicitlyRejected(error) ? 'rejected' : 'uncertain', message: explicitlyRejected(error) ? 'Wallet rejected the request. No action confirmed.' : 'Wallet response uncertain. Check wallet activity and recover the hash; do not resubmit.'}
    save(store, record); throw error
  }
}
// Hash recovery is read-only; an arbitrary hash cannot establish success because all fields are verified below.
export async function reconcileAction(client: GameplayClient, store: Journal, suppliedHash?: Hex): Promise<{record: PendingAction; result?: ConfirmedAction}> {
  let record = loadAction(store)
  requireThat(record && isBlocking(record), 'No unresolved action to check')
  const hash = suppliedHash ?? record.hash
  requireThat(hash && /^0x[0-9a-fA-F]{64}$/.test(hash), 'Recover the transaction hash from wallet activity. Never retry an unknown submission.')
  requireThat(await client.getChainId() === 143, 'Receipt RPC network mismatch')
  const identity = `${record.account.toLowerCase()}:${record.nonce}:${record.tokenId}:${record.data}`
  const persist = (next: PendingAction) => {
    const latest = loadAction(store)
    requireThat(latest && isBlocking(latest) && `${latest.account.toLowerCase()}:${latest.nonce}:${latest.tokenId}:${latest.data}` === identity, 'Pending record changed in another tab; reload status')
    save(store, next)
  }
  const original = await client.getTransaction({hash})
  requireThat(same(original.from, record.account) && original.nonce === record.nonce, 'Recovery hash is not the originating sender and nonce')
  // Keep the hash durable before polling; late receipts remain recoverable after a timeout or refresh.
  record = {...record, hash, phase: 'pending'}; persist(record)
  const receipt = await client.waitForTransactionReceipt({hash, confirmations: 3, timeout: 120_000, onReplaced: replacement => {
    // No new transaction is requested. Track wallet repricing, cancellation and replacement.
    record = {...record!, hash: replacement.transaction.hash, phase: 'pending'}; persist(record)
  }})
  const [block, finalized, tx] = await Promise.all([client.getBlock({blockNumber: receipt.blockNumber}), client.getBlock({blockTag: 'finalized'}), client.getTransaction({hash: receipt.transactionHash})])
  requireThat(finalized.number !== null && finalized.number >= receipt.blockNumber && block.hash === receipt.blockHash && same(tx.from, record.account) && tx.nonce === record.nonce && tx.blockHash === receipt.blockHash && receipt.transactionHash === tx.hash && same(receipt.from, record.account), 'Receipt not verified on finalized canonical chain')
  const exact = tx.to && same(tx.to, GAME) && tx.input === record.data && tx.value === 0n && tx.chainId === 143
  if (!exact) {
    const cancelled = same(tx.to ?? '', record.account) && tx.value === 0n && tx.input === '0x'
    record = {...record, hash: tx.hash, phase: cancelled ? 'cancelled' : 'replaced', message: 'Originating nonce finalized with a different transaction. No game result is claimed.'}; persist(record); return {record}
  }
  if (receipt.status !== 'success') {record = {...record, hash: tx.hash, phase: 'reverted', message: 'Canonical receipt reverted. No survivor progression confirmed.'}; persist(record); return {record}}
  const matches = receipt.logs.flatMap(log => {
    if (!same(log.address, GAME) || log.removed) return []
    try {const decoded = decodeEventLog({abi: [adventureResolvedEvent], data: log.data, topics: log.topics, strict: true});return [decoded.args]} catch {return []}
  }).filter(a => a.tokenId === BigInt(record!.tokenId) && same(a.owner, record!.account) && a.choiceId === record!.choiceId && a.day === block.timestamp / 86400n && a.day >= BigInt(record!.day) && a.eventId >= 1 && a.eventId <= 6 && a.outcomeId === (a.eventId - 1) * 3 + a.choiceId)
  requireThat(matches.length === 1 && same(receipt.to ?? '', GAME), 'Receipt lacks one exact AdventureResolved event; outcome remains unverified')
  const a = matches[0]
  const [state, title, eventId] = await Promise.all([
    client.readContract({address: GAME, abi: gameReadAbi, functionName: 'characterOf', args: [BigInt(record.tokenId)], blockNumber: receipt.blockNumber}),
    client.readContract({address: GAME, abi: gameReadAbi, functionName: 'titleOf', args: [BigInt(record.tokenId)], blockNumber: receipt.blockNumber}),
    client.readContract({address: GAME, abi: gameReadAbi, functionName: 'eventFor', args: [BigInt(record.tokenId), a.day], blockNumber: receipt.blockNumber}),
  ])
  requireThat(state.hasActed && state.lastActionDay === a.day && state.lastOutcomeId === a.outcomeId && state.xp === a.xpAfter && state.trust === a.trustAfter && state.scars === a.scarsAfter && state.streak === a.streakAfter && state.unmarkedStreak === a.unmarkedStreakAfter && state.achievementMask === a.achievementMaskAfter && eventId === a.eventId && title >= 0 && title <= 3, 'Receipt event and confirmed state disagree; no success claim')
  // Recheck the exact block after post-receipt reads.
  requireThat((await client.getBlock({blockNumber: receipt.blockNumber})).hash === receipt.blockHash, 'Receipt block changed during verification')
  record = {...record, hash: tx.hash, phase: 'confirmed'}; persist(record)
  return {record, result: {hash: tx.hash, block: receipt.blockNumber, tokenId: a.tokenId, day: a.day, eventId: a.eventId, choiceId: a.choiceId, xp: a.xpAfter, trust: a.trustAfter, scars: a.scarsAfter, streak: a.streakAfter, unmarkedStreak: a.unmarkedStreakAfter, achievementMask: a.achievementMaskAfter, titleId: title}}
}
