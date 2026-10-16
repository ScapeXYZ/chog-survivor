import {act, cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'
import {decodeEventLog, encodeAbiParameters, encodeEventTopics} from 'viem'
import type {ContractPreview} from './adventureSession'

const mock = vi.hoisted(() => ({
  address: '0x1111111111111111111111111111111111111111' as `0x${string}`,
  owner: '0x1111111111111111111111111111111111111111', chainId: 31338, connected: true,
  day: 100n, eventId: 1, ownerFetching: false, previewFetching: false, previewError: false,
  previewOverride: {} as Partial<ContractPreview>, freshOverride: {} as Partial<ContractPreview>,
  freshOwner: undefined as string | undefined, freshChain: 31338, freshBinding: undefined as string | undefined,
  acted: false, actedDays: new Map<string, bigint>(), refreshError: false,
  read: vi.fn(), write: vi.fn(), refresh: vi.fn(), block: vi.fn(), receipt: vi.fn(), preflight: vi.fn(),
}))
vi.mock('./contracts', async original => ({...await original<typeof import('./contracts')>(), localMode: true, contractMode: true, activeChain: {id: 31338}, environmentReady: true, approvedGameAddress: '0x3333333333333333333333333333333333333333'}))
vi.mock('wagmi', async original => ({
  ...await original<typeof import('wagmi')>(),
  useAccount: () => ({address: mock.address, isConnected: mock.connected, chainId: mock.chainId}),
  usePublicClient: () => client,
  useWriteContract: () => ({writeContractAsync: mock.write}),
  useReadContract: (request: {functionName: string; args?: readonly (bigint | number)[]; scopeKey?: string; query: {enabled: boolean}}) => {
    mock.read(request)
    const data = request.functionName === 'ownerOf' ? mock.owner : request.functionName === 'CHOG_GENESIS' ? CHOG_GENESIS : request.functionName === 'eventFor' ? mock.eventId : request.functionName === 'characterOf' ? {xp: 0, trust: 0, scars: 0, streak: 0, hasActed: mock.acted || mock.actedDays.has(String(request.args?.[0])), lastActionDay: mock.actedDays.get(String(request.args?.[0])) ?? mock.day} : request.functionName === 'preview' ? {...preview(Number(request.args?.[1] ?? 1), BigInt(request.args?.[0] ?? 1001)), ...mock.previewOverride} : 0
    return {data, isLoading: false, isFetching: request.functionName === 'ownerOf' ? mock.ownerFetching : request.functionName === 'preview' && mock.previewFetching,
      isError: request.functionName === 'preview' && mock.previewError,
      refetch: () => { mock.refresh(request); return Promise.resolve({data, isError: mock.refreshError}) }}
  },
}))

import {LocalContractAdventure} from './LocalContractAdventure'
import {CHOG_GENESIS, approvedGameAddress, gameLocalWriteAbi} from './contracts'
import {events} from './game-data'
import {miniGameData, miniGameKindByCategory} from './mini-game-data'
import {achievementEarnedEvent, adventureResolvedEvent} from './survivalHistory'

const hash = `0x${'a'.repeat(64)}` as `0x${string}`
function preview(choiceId = 1, tokenId = 1001n): ContractPreview {
  return {day: mock.day, eventId: mock.eventId, choiceId, outcomeId: (mock.eventId - 1) * 3 + choiceId, xpDelta: 12, trustDelta: 5, scarsDelta: 0, xpAfter: 12, trustAfter: 5, scarsAfter: 0, streakAfter: 1, unmarkedStreakAfter: 1, newlyEarnedAchievementMask: 1n, achievementMaskAfter: 1n, titleId: 0, canAct: !mock.acted && mock.actedDays.get(String(tokenId)) !== mock.day}
}
function receipt(tokenId = 1001n, choiceId = 1, overrides: Partial<ContractPreview> = {}, owner = mock.address, address = approvedGameAddress!) {
  const p = {...preview(choiceId), ...overrides}
  const topics = encodeEventTopics({abi: [adventureResolvedEvent], eventName: 'AdventureResolved', args: {tokenId, owner, day: p.day}})
  const data = encodeAbiParameters(adventureResolvedEvent.inputs.filter(input => !('indexed' in input && input.indexed)), [p.eventId, p.choiceId, p.outcomeId, p.xpDelta, p.trustDelta, p.scarsDelta, p.xpAfter, p.trustAfter, p.scarsAfter, p.streakAfter, p.unmarkedStreakAfter, p.achievementMaskAfter])
  return {status: 'success', blockNumber: 10n, logs: [{address, data, topics}]}
}
const client = {
  getBlock: mock.block,
  getChainId: async () => mock.freshChain,
  readContract: mock.preflight,
  waitForTransactionReceipt: async (...args: unknown[]) => {
    const confirmed = await mock.receipt(...args)
    if (confirmed.status === 'success') for (const log of confirmed.logs) {
      if (log.address.toLowerCase() !== approvedGameAddress!.toLowerCase()) continue
      try {
        const event = decodeEventLog({abi: [adventureResolvedEvent], topics: log.topics, data: log.data})
        mock.actedDays.set(String(event.args.tokenId), event.args.day)
      } catch { /* No authoritative adventure state from unrelated logs. */ }
    }
    return confirmed
  },
}
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return {promise, resolve}
}
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
})
beforeEach(() => {
  vi.clearAllMocks()
  mock.actedDays.clear()
  Object.assign(mock, {address: '0x1111111111111111111111111111111111111111', owner: '0x1111111111111111111111111111111111111111', chainId: 31338, connected: true, day: 100n, eventId: 1, ownerFetching: false, previewFetching: false, previewError: false, previewOverride: {}, freshOverride: {}, freshOwner: undefined, freshChain: 31338, freshBinding: undefined, acted: false, refreshError: false})
  mock.block.mockImplementation(async () => ({timestamp: mock.day * 86400n, number: 10n}))
  mock.preflight.mockImplementation(async (request: {functionName: string; args?: (bigint | number)[]}) => request.functionName === 'CHOG_GENESIS' ? mock.freshBinding ?? CHOG_GENESIS : request.functionName === 'ownerOf' ? mock.freshOwner ?? mock.owner : request.functionName === 'eventFor' ? mock.eventId : {...preview(Number(request.args?.[1]), BigInt(request.args?.[0] ?? 1001)), ...mock.freshOverride})
  mock.write.mockResolvedValue(hash)
  mock.receipt.mockImplementation(async () => receipt())
})
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

async function open(choiceIndex = 0, tokenId = 1001n) {
  const view = render(<LocalContractAdventure selectedToken={tokenId} onHome={vi.fn()}/>)
  const choices = await screen.findAllByRole('button', {name: /Preview contract result/})
  await waitFor(() => expect(choices[choiceIndex]).toBeEnabled())
  choices[choiceIndex].focus(); fireEvent.click(choices[choiceIndex])
  return {...view, choices}
}
function skip() { fireEvent.click(screen.getByRole('button', {name: 'Skip interaction'})) }
async function confirm() {
  const button = screen.getByRole('button', {name: 'CONFIRM LOCAL ACTION'})
  expect(button).toBeEnabled(); fireEvent.click(button)
  await waitFor(() => expect(mock.write).toHaveBeenCalledOnce())
}

describe('local contract mini-game integration', () => {
  it.each(events.flatMap((event, eventIndex) => event.choices.map((label, choiceIndex) => ({event, eventIndex, label, choiceIndex}))))('preserves $label and its contract arguments', async ({event, eventIndex, label, choiceIndex}) => {
    mock.eventId = eventIndex + 1
    mock.receipt.mockImplementation(async () => receipt(1001n, choiceIndex + 1))
    await open(choiceIndex)
    expect(screen.getByRole('dialog', {name: label})).toBeVisible()
    expect(screen.getByRole('heading', {name: new RegExp(`^${event.tags[choiceIndex] === 'cautious' ? 'Survivor’s Trial' : miniGameKindByCategory[event.tags[choiceIndex]]}$`, 'i')})).toBeVisible()
    expect(screen.queryByText(/Authoritative contract preview · projected outcome/)).not.toBeInTheDocument()
    expect(mock.read.mock.calls.filter(([request]) => request.functionName === 'preview').every(([request]) => !request.query.enabled)).toBe(true)
    skip()
    expect(screen.getByText(/Authoritative contract preview · projected outcome/)).toBeVisible()
    expect(mock.write).not.toHaveBeenCalled()
    await confirm()
    expect(mock.write).toHaveBeenCalledWith({address: approvedGameAddress, abi: gameLocalWriteAbi, functionName: 'act', args: [1001n, choiceIndex + 1], account: mock.address, chainId: 31338})
    await screen.findByText(/Verified on-chain outcome/)
  })

  it('shows a reaction only after success and announces only matching new achievement events', async () => {
    const pendingReceipt = deferred<ReturnType<typeof receipt>>()
    mock.receipt.mockReturnValue(pendingReceipt.promise)
    await open(); skip()
    expect(screen.queryByRole('status', {name: 'Confirmed Chog reaction'})).not.toBeInTheDocument()
    await confirm()
    expect(screen.queryByRole('status', {name: 'Confirmed Chog reaction'})).not.toBeInTheDocument()
    const confirmed = receipt(1001n, 1, {xpAfter: 99, xpDelta: 99, trustDelta: 0, scarsDelta: 0, achievementMaskAfter: 3n})
    const earned = (tokenId: bigint, achievementId: number, day: bigint) => ({address: approvedGameAddress!, topics: encodeEventTopics({abi: [achievementEarnedEvent], eventName: 'AchievementEarned', args: {tokenId, achievementId, day}}), data: '0x' as const})
    confirmed.logs.push(earned(1001n, 0, mock.day), earned(1001n, 0, mock.day), earned(1001n, 1, mock.day + 1n), earned(1002n, 1, mock.day))
    await act(async () => pendingReceipt.resolve(confirmed))
    const reaction = screen.getByRole('status', {name: 'Confirmed Chog reaction'})
    expect(reaction).toHaveTextContent('I steadied the crossing')
    expect(reaction).toHaveTextContent('Trust held steady. Scars stayed unchanged.')
    expect(reaction).toHaveTextContent('New achievements: First Light')
    expect(within(reaction).queryByText(/Bridge Builder/)).not.toBeInTheDocument()
    expect(screen.getByText(/Recorded state: 99 XP/)).toBeVisible()
  })

  it('does not call cumulative achievements newly earned without event evidence', async () => {
    mock.receipt.mockResolvedValue(receipt(1001n, 1, {achievementMaskAfter: 255n}))
    await open(); skip(); await confirm()
    await screen.findByRole('status', {name: 'Confirmed Chog reaction'})
    expect(screen.queryByText(/New achievements:/)).not.toBeInTheDocument()
  })

  it('uses the actual next-day encounter for a transaction confirmed after UTC rollover', async () => {
    mock.receipt.mockResolvedValue(receipt(1001n, 1, {day: mock.day + 1n, eventId: 2, outcomeId: 4}))
    await open(); skip(); await confirm()
    const reaction = await screen.findByRole('status', {name: 'Confirmed Chog reaction'})
    expect(reaction).toHaveTextContent('I shared my rations')
    expect(reaction).toHaveTextContent('UTC day 101')
    expect(screen.getByRole('dialog', {name: 'Share rations'})).toBeVisible()
    expect(reaction.querySelector('time')).toBeNull() // Mismatched mock block time is never substituted.
  })

  it.each(['rejected', 'failed', 'missing-evidence'])('does not create a memory for %s', async failure => {
    if (failure === 'rejected') mock.write.mockRejectedValue(new Error('User rejected request'))
    else if (failure === 'failed') mock.receipt.mockResolvedValue({status: 'reverted', logs: []})
    else mock.receipt.mockResolvedValue({status: 'success', logs: []})
    await open(); skip(); await confirm()
    await screen.findByRole('button', {name: 'RETURN TO ADVENTURE'})
    expect(screen.queryByRole('status', {name: 'Confirmed Chog reaction'})).not.toBeInTheDocument()
    expect(screen.queryByText(/New achievements:/)).not.toBeInTheDocument()
  })

  it('allows trial retry and completion without writing or changing the original choice', async () => {
    await open()
    fireEvent.change(screen.getByLabelText('Difficulty'), {target: {value: 'medium'}}); fireEvent.click(screen.getByRole('button', {name: /^Row 2, path 3/}))
    expect(screen.getByText(/Hazard!/)).toBeVisible()
    expect(screen.getByLabelText('Contract-backed character statistics')).toHaveTextContent('XP0')
    fireEvent.change(screen.getByLabelText('Difficulty'), {target: {value: 'easy'}}); [2, 3, 4].forEach(row => fireEvent.click(screen.getByRole('button', {name: new RegExp(`^Row ${row}, path 2`)})))
    fireEvent.click(screen.getByRole('button', {name: 'Continue'}))
    expect(mock.write).not.toHaveBeenCalled()
    await confirm()
    expect(mock.write.mock.calls[0][0].args).toEqual([1001n, 1])
  })

  it('resets Hard completion before skip and preserves the original contract choice', async () => {
    await open()
    fireEvent.change(screen.getByLabelText('Difficulty'), {target: {value: 'hard'}})
    ;[2, 2, 1, 1, 2].forEach((path, stage) => fireEvent.click(screen.getByRole('button', {name: new RegExp(`^Row ${stage + 2}, path ${path}`)})))
    expect(screen.getByRole('button', {name: 'Continue'})).toBeEnabled()
    expect(mock.write).not.toHaveBeenCalled()
    expect(screen.queryByText(/Authoritative contract preview/)).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Difficulty'), {target: {value: 'easy'}})
    expect(screen.queryByRole('button', {name: 'Continue'})).not.toBeInTheDocument()
    skip()
    await confirm()
    expect(mock.write.mock.calls[0][0].args).toEqual([1001n, 1])
  })

  it.each([0, 1])('keeps Story response %s within the same contract choice', async responseIndex => {
    mock.eventId = 2
    await open()
    const story = miniGameData['Hungry Stranger'].choices[0].interaction
    fireEvent.click(screen.getByRole('button', {name: story.responses[responseIndex]}))
    fireEvent.click(screen.getByRole('button', {name: 'Continue'}))
    expect(mock.write).not.toHaveBeenCalled()
    await confirm()
    expect(mock.write.mock.calls[0][0].args).toEqual([1001n, 1])
  })

  it('uses untimed Timing completion without changing choice ID', async () => {
    vi.stubGlobal('matchMedia', () => ({matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn()}))
    await open(1)
    fireEvent.click(screen.getByRole('button', {name: 'I am ready'}))
    fireEvent.click(screen.getByRole('button', {name: 'Continue'}))
    expect(mock.write).not.toHaveBeenCalled()
    await confirm()
    expect(mock.write.mock.calls[0][0].args).toEqual([1001n, 2])
  })

  it.each([
    {day: 99n}, {eventId: 2}, {choiceId: 2}, {outcomeId: 9}, {xpAfter: NaN}, {canAct: false},
  ])('disables confirmation for mismatched or ineligible preview %#', async override => {
    mock.previewOverride = override
    await open(); skip()
    expect(screen.getByRole('button', {name: 'DAILY ACTION UNAVAILABLE'})).toBeDisabled()
    expect(mock.write).not.toHaveBeenCalled()
  })

  it.each(['previewFetching', 'previewError'] as const)('fails closed on %s even with cached preview data', async flag => {
    const view = await open(); skip()
    mock[flag] = true
    view.rerender(<LocalContractAdventure selectedToken={1001n} onHome={vi.fn()}/>)
    expect(screen.getByRole('button', {name: 'DAILY ACTION UNAVAILABLE'})).toBeDisabled()
    expect(screen.queryByText(/Projected after action/)).not.toBeInTheDocument()
  })

  it.each(['owner', 'binding', 'chain', 'day', 'reward', 'rpc', 'lock', 'advanced-block'])('rechecks %s immediately before signing', async failure => {
    await open(); skip()
    if (failure === 'owner') mock.freshOwner = '0x2222222222222222222222222222222222222222'
    if (failure === 'binding') mock.freshBinding = '0x2222222222222222222222222222222222222222'
    if (failure === 'chain') mock.freshChain = 143
    if (failure === 'day') mock.day++
    if (failure === 'reward') mock.freshOverride = {xpDelta: 99}
    if (failure === 'rpc') mock.preflight.mockRejectedValue(new Error('RPC unavailable'))
    if (failure === 'lock') mock.freshOverride = {canAct: false}
    if (failure === 'advanced-block') mock.block.mockResolvedValueOnce({number: 10n, timestamp: mock.day * 86400n}).mockResolvedValueOnce({number: 11n, timestamp: mock.day * 86400n})
    fireEvent.click(screen.getByRole('button', {name: 'CONFIRM LOCAL ACTION'}))
    await screen.findByRole('button', {name: 'RETURN TO ADVENTURE'})
    expect(mock.write).not.toHaveBeenCalled()
    expect(screen.queryByText(/Verified on-chain outcome/)).not.toBeInTheDocument()
  })

  it.each(['wallet', 'token', 'owner', 'network', 'disconnect'])('discards the interaction on %s change', async change => {
    const view = await open()
    let token = 1001n
    if (change === 'wallet') mock.address = '0x2222222222222222222222222222222222222222'
    if (change === 'token') token = 1002n
    if (change === 'owner') mock.owner = '0x2222222222222222222222222222222222222222'
    if (change === 'network') mock.chainId = 143
    if (change === 'disconnect') mock.connected = false
    view.rerender(<LocalContractAdventure selectedToken={token} onHome={vi.fn()}/>)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(mock.write).not.toHaveBeenCalled()
  })

  it('discards an unsigned choice at chain UTC rollover', async () => {
    const interval = vi.spyOn(window, 'setInterval')
    await open(); skip()
    mock.day++
    const poll = interval.mock.calls.find(([, delay]) => delay === 15_000)![0] as () => void
    await act(async () => { poll(); await Promise.resolve() })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(mock.write).not.toHaveBeenCalled()
  })

  it('prevents duplicate submission and shows only receipt-derived results after success', async () => {
    const pendingReceipt = deferred<ReturnType<typeof receipt>>()
    mock.receipt.mockReturnValue(pendingReceipt.promise)
    const view = await open(); skip()
    const button = screen.getByRole('button', {name: 'CONFIRM LOCAL ACTION'})
    fireEvent.click(button); fireEvent.click(button)
    await waitFor(() => expect(mock.write).toHaveBeenCalledOnce())
    expect(screen.queryByText(/Verified on-chain outcome/)).not.toBeInTheDocument()
    fireEvent(screen.getByRole('dialog'), new Event('cancel', {cancelable: true}))
    expect(screen.getByRole('dialog')).toBeVisible()
    await act(async () => pendingReceipt.resolve(receipt(1001n, 1, {xpAfter: 99, xpDelta: 99, achievementMaskAfter: 3n})))
    expect(screen.getByText(/Recorded state: 99 XP/)).toBeVisible()
    expect(screen.getByText(/Recorded achievements: First Light, Bridge Builder/)).toBeVisible()
    fireEvent.click(screen.getByRole('button', {name: 'RETURN TO ADVENTURE'}))
    expect(view.choices.every(button => (button as HTMLButtonElement).disabled)).toBe(true)
    expect(screen.getByRole('button', {name: /Back to Home/})).toHaveFocus()
    expect(mock.write).toHaveBeenCalledOnce()
  })

  it('never attaches a late receipt to another token or refreshes that token with old results', async () => {
    const pendingReceipt = deferred<ReturnType<typeof receipt>>()
    mock.receipt.mockReturnValue(pendingReceipt.promise)
    const view = await open(); skip(); await confirm()
    view.rerender(<LocalContractAdventure selectedToken={1002n} onHome={vi.fn()}/>)
    await act(async () => pendingReceipt.resolve(receipt()))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText(/Verified on-chain outcome/)).not.toBeInTheDocument()
    expect(screen.getByText(/Transaction for CHOG #1001: confirmed/)).toBeVisible()
    expect(mock.refresh).not.toHaveBeenCalled()
  })

  it('refreshes the authoritative daily lock immediately after execution-day rollover without polling or reopening', async () => {
    mock.receipt.mockImplementation(async () => {
      const confirmed = receipt(1001n, 1, {day: 101n, eventId: 2, outcomeId: 4})
      mock.day = 101n; mock.eventId = 2; mock.acted = true
      return confirmed
    })
    await open(); skip(); await confirm()
    await screen.findByText('Verified on-chain outcome 4 · UTC day 101')
    fireEvent.click(screen.getByRole('button', {name: 'RETURN TO ADVENTURE'}))
    expect(screen.getAllByRole('button', {name: /Preview contract result/}).every(button => (button as HTMLButtonElement).disabled)).toBe(true)
    expect(screen.getByText(/already acted for the current local-chain UTC day/)).toBeVisible()
    expect(screen.getByText(/Encounter day: UTC day 101/)).toBeVisible()
    expect(mock.write).toHaveBeenCalledOnce()
  })

  it('keeps a pending transaction through rollover and displays the actual execution-day outcome', async () => {
    const interval = vi.spyOn(window, 'setInterval')
    const pendingReceipt = deferred<ReturnType<typeof receipt>>()
    mock.receipt.mockReturnValue(pendingReceipt.promise)
    await open(); skip(); await confirm()
    mock.day++; mock.eventId = 2
    const poll = interval.mock.calls.find(([, delay]) => delay === 15_000)![0] as () => void
    await act(async () => { poll(); await Promise.resolve() })
    expect(screen.getByRole('dialog')).toBeVisible()
    expect(screen.queryByText(/Verified on-chain outcome/)).not.toBeInTheDocument()
    await act(async () => pendingReceipt.resolve(receipt(1001n, 1, {day: mock.day, eventId: 2, outcomeId: 4})))
    expect(screen.getByText('Verified on-chain outcome 4 · UTC day 101')).toBeVisible()
    expect(screen.getByText('Hungry Stranger · Share rations')).toBeVisible()
    expect(screen.getByText(/UTC day changed before execution/)).toBeVisible()
    expect(mock.write).toHaveBeenCalledOnce()
  })

  it.each(['wallet', 'transfer'])('keeps late %s receipts separate from the current controller', async change => {
    const pendingReceipt = deferred<ReturnType<typeof receipt>>()
    const originalReceipt = receipt()
    mock.receipt.mockReturnValue(pendingReceipt.promise)
    const view = await open(); skip(); await confirm()
    if (change === 'wallet') mock.address = '0x2222222222222222222222222222222222222222'
    else mock.owner = '0x2222222222222222222222222222222222222222'
    view.rerender(<LocalContractAdventure selectedToken={1001n} onHome={vi.fn()}/>)
    await act(async () => pendingReceipt.resolve(originalReceipt))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText(/Verified on-chain outcome/)).not.toBeInTheDocument()
    expect(screen.getByText(/Transaction for CHOG #1001: confirmed/)).toBeVisible()
    expect(mock.refresh).not.toHaveBeenCalled()
  })

  it('retains pending tracking while ownership is being reverified', async () => {
    const pendingReceipt = deferred<ReturnType<typeof receipt>>()
    mock.receipt.mockReturnValue(pendingReceipt.promise)
    const view = await open(); skip(); await confirm()
    mock.ownerFetching = true
    view.rerender(<LocalContractAdventure selectedToken={1001n} onHome={vi.fn()}/>)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText(/Transaction for CHOG #1001: submitted/)).toBeVisible()
    mock.ownerFetching = false
    view.rerender(<LocalContractAdventure selectedToken={1001n} onHome={vi.fn()}/>)
    expect(screen.getByRole('dialog')).toBeVisible()
    await act(async () => pendingReceipt.resolve(receipt()))
    expect(screen.getByText(/Verified on-chain outcome/)).toBeVisible()
    expect(mock.write).toHaveBeenCalledOnce()
  })

  it('aborts before signing when wallet context changes during preflight', async () => {
    const pendingBlock = deferred<{number: bigint; timestamp: bigint}>()
    const view = await open(); skip()
    mock.block.mockReturnValueOnce(pendingBlock.promise)
    fireEvent.click(screen.getByRole('button', {name: 'CONFIRM LOCAL ACTION'}))
    mock.address = '0x2222222222222222222222222222222222222222'
    view.rerender(<LocalContractAdventure selectedToken={1001n} onHome={vi.fn()}/>)
    await act(async () => pendingBlock.resolve({number: 10n, timestamp: mock.day * 86400n}))
    expect(mock.write).not.toHaveBeenCalled()
  })

  it.each(['rejected', 'reverted'])('handles a %s transaction without confirmed results or a fake daily lock', async failure => {
    if (failure === 'rejected') mock.write.mockRejectedValue(new Error('User rejected the request'))
    else mock.receipt.mockResolvedValue({status: 'reverted', logs: []})
    const view = await open(); skip()
    fireEvent.click(screen.getByRole('button', {name: 'CONFIRM LOCAL ACTION'}))
    await screen.findByRole('button', {name: 'RETURN TO ADVENTURE'})
    expect(screen.getByText(failure === 'rejected' ? /Wallet rejected the request/ : /Transaction failed or reverted/)).toBeVisible()
    expect(screen.queryByText(/Verified on-chain outcome/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: 'RETURN TO ADVENTURE'}))
    expect(view.choices[0]).toBeEnabled()
  })

  it.each(['missing', 'foreign', 'wrong-token'])('does not invent an outcome from %s receipt evidence', async kind => {
    mock.receipt.mockResolvedValue(kind === 'missing' ? {status: 'success', logs: []} : kind === 'foreign' ? receipt(1001n, 1, {}, mock.address, CHOG_GENESIS) : receipt(1002n))
    await open(); skip(); await confirm()
    await screen.findByText(/verified outcome evidence are temporarily unavailable/)
    expect(screen.queryByText(/Verified on-chain outcome/)).not.toBeInTheDocument()
  })

  it('preserves Escape cancellation, focus restoration and scroll cleanup', async () => {
    const view = await open()
    expect(within(screen.getByRole('dialog')).getByRole('button', {name: 'Skip interaction'})).toHaveFocus()
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent(screen.getByRole('dialog'), new Event('cancel', {cancelable: true}))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(view.choices[0]).toHaveFocus()
    expect(document.body.style.overflow).toBe('')
  })
})
