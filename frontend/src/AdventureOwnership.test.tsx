import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'
const mock = vi.hoisted(() => ({local: false, owner: '0x1111111111111111111111111111111111111111', address: '0x1111111111111111111111111111111111111111', fetching: false, read: vi.fn(), write: vi.fn()}))
vi.mock('./contracts', async (original) => ({...await original<typeof import('./contracts')>(), get localMode() {return mock.local}, get contractMode() {return mock.local}, activeChain: {id: 31338}, environmentReady: true, approvedGameAddress: '0x3333333333333333333333333333333333333333'}))
const client = {
  getBlock: async () => ({timestamp: 86400000n, number: 10n}), getChainId: async () => 31338,
  readContract: async (request: {functionName: string}) => request.functionName === 'ownerOf' ? mock.owner : request.functionName === 'CHOG_GENESIS' ? CHOG_GENESIS : request.functionName === 'eventFor' ? 1 : {day: 1000n, eventId: 1, choiceId: 1, outcomeId: 1, xpDelta: 12, trustDelta: 5, scarsDelta: 0, xpAfter: 12, trustAfter: 5, scarsAfter: 0, streakAfter: 1, unmarkedStreakAfter: 1, newlyEarnedAchievementMask: 1n, achievementMaskAfter: 1n, titleId: 0, canAct: true},
}
vi.mock('wagmi', async original => ({
  ...await original<typeof import('wagmi')>(),
  useAccount: () => ({address: mock.address, isConnected: true, chainId: 31338}),
  usePublicClient: () => client,
  useWriteContract: () => ({writeContractAsync: mock.write}),
  useReadContract: (r: {functionName: string; query: {enabled: boolean}}) => {
    mock.read(r)
    const data = r.functionName === 'ownerOf' ? mock.owner : r.functionName === 'CHOG_GENESIS' ? CHOG_GENESIS : r.functionName === 'eventFor' ? 1 : r.functionName === 'characterOf' ? {hasActed: false, xp: 10, trust: 10, scars: 0, streak: 1} : r.functionName === 'preview' ? {canAct: true} : 0
    return {data, isFetching: r.functionName === 'ownerOf' && mock.fetching, isLoading: false, isError: false, refetch: vi.fn()}
  },
}))
import {Adventure} from './Adventure'
import {CHOG_GENESIS} from './contracts'
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {this.setAttribute('open', '')}
  HTMLDialogElement.prototype.close = function () {this.removeAttribute('open')}
})
beforeEach(() => {vi.clearAllMocks(); mock.owner = mock.address; mock.fetching = false})
afterEach(cleanup)
describe.each([true])('ownership, local contract = %s', local => {
  beforeEach(() => {mock.local = local})
  it('shows dynamic ownership state and navigation while disabling choices, previews and writes', async () => {
    mock.owner = '0x2222222222222222222222222222222222222222'
    const find = vi.fn(), history = vi.fn()
    const props = {now: 86400000, selectedToken: 1001n, onHome: vi.fn(), onFindChogs: find, onHistory: history}
    const view = render(<Adventure {...props}/>)
    expect(screen.getByText('CHOG #1001 · CONTROLLED BY ANOTHER WALLET')).toBeVisible()
    expect(screen.getByText(/progression, achievements and survival history remain with the NFT/)).toBeVisible()
    fireEvent.click(screen.getByRole('button', {name: /find my chogs/i})); expect(find).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole('button', {name: /view survivor history/i})); expect(history).toHaveBeenCalledOnce()
    const choices = await screen.findAllByRole('button', {name: /preview (choice|contract result)/i})
    expect(choices).toHaveLength(3)
    for (const choice of choices) {expect(choice).toBeDisabled(); fireEvent.click(choice)}
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(mock.write).not.toHaveBeenCalled()
    expect(mock.read.mock.calls.filter(([r]) => r.functionName === 'preview').every(([r]) => !r.query.enabled)).toBe(true)
    view.rerender(<Adventure {...props} selectedToken={2042n}/>)
    expect(screen.getByText('CHOG #2042 · CONTROLLED BY ANOTHER WALLET')).toBeVisible()
  })
  it('closes open previews on transfer and discards stale choices on regaining ownership', async () => {
    const props = {now: 86400000, selectedToken: 1001n, onHome: vi.fn()}
    const view = render(<Adventure {...props}/>)
    const choices = await screen.findAllByRole('button', {name: /preview (choice|contract result)/i})
    await waitFor(() => expect(choices[0]).toBeEnabled())
    fireEvent.click(choices[0]); expect(screen.getByRole('dialog')).toBeVisible()
    mock.owner = '0x2222222222222222222222222222222222222222'
    view.rerender(<Adventure {...props}/>)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    mock.owner = mock.address; view.rerender(<Adventure {...props}/>)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(mock.write).not.toHaveBeenCalled()
  })
  it('fails closed during ownership verification without claiming a transfer', () => {
    mock.fetching = true
    render(<Adventure now={86400000} selectedToken={1001n} onHome={vi.fn()}/>)
    expect(screen.queryByText(/· CONTROLLED BY ANOTHER WALLET/)).not.toBeInTheDocument()
    expect(mock.read.mock.calls.filter(([r]) => r.functionName === 'preview').every(([r]) => !r.query.enabled)).toBe(true)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
