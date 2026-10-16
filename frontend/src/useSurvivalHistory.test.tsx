import {act, cleanup, renderHook, waitFor} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
const mocks = vi.hoisted(() => ({read: vi.fn(), client: {}}))
vi.mock('wagmi', () => ({usePublicClient: () => mocks.client}))
vi.mock('./contracts', () => ({activeChain: {id: 31338}, approvedGameAddress: '0x3333333333333333333333333333333333333333', deploymentStartBlock: 4n, contractMode: true, mainnetMode: false}))
vi.mock('./survivalHistory', () => ({readSurvivalHistory: mocks.read}))
import {useSurvivalHistory} from './useSurvivalHistory'
const history = {records: [], complete: true, partial: false, latestBlock: 10n}
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done }); return {promise, resolve} }
beforeEach(() => { vi.clearAllMocks(); mocks.read.mockResolvedValue(history) })
afterEach(cleanup)
describe('token-scoped permanent journal loading', () => {
  it('clears the previous token immediately and ignores its late response', async () => {
    const first = deferred<typeof history>(), second = deferred<typeof history>()
    mocks.read.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const view = renderHook(({token}) => useSurvivalHistory(token, true), {initialProps: {token: 1001n}})
    view.rerender({token: 1002n})
    await act(async () => first.resolve({...history, latestBlock: 99n}))
    expect(view.result.current.result).toBeUndefined()
    await act(async () => second.resolve({...history, latestBlock: 12n}))
    expect(view.result.current.result?.latestBlock).toBe(12n)
    expect(mocks.read.mock.calls.map(call => call[2])).toEqual([1001n, 1002n])
  })
  it('hides loaded history immediately when ownership verification or network eligibility is lost', async () => {
    const view = renderHook(({enabled}) => useSurvivalHistory(2006n, enabled), {initialProps: {enabled: true}})
    await waitFor(() => expect(view.result.current.result).toEqual(history))
    view.rerender({enabled: false})
    expect(view.result.current.result).toBeUndefined()
  })
  it('retains a token-scoped history after a controller/wallet change and a fresh verification', async () => {
    const view = renderHook(({enabled}) => useSurvivalHistory(2006n, enabled), {initialProps: {enabled: true}})
    await waitFor(() => expect(view.result.current.result).toEqual(history))
    view.rerender({enabled: false}); view.rerender({enabled: true})
    await waitFor(() => expect(view.result.current.result).toEqual(history))
    expect(mocks.read.mock.calls.every(call => call[2] === 2006n)).toBe(true)
  })
  it('refreshes only from authoritative reads, without fabricating pending journal entries', async () => {
    const refreshed = deferred<typeof history>()
    mocks.read.mockResolvedValueOnce(history).mockReturnValueOnce(refreshed.promise)
    const view = renderHook(() => useSurvivalHistory(2006n, true))
    await waitFor(() => expect(view.result.current.result).toEqual(history))
    act(() => window.dispatchEvent(new Event('chog-local-history-refresh')))
    expect(view.result.current.result).toBeUndefined()
    await act(async () => refreshed.resolve({...history, latestBlock: 11n}))
    expect(view.result.current.result?.latestBlock).toBe(11n)
  })
})
