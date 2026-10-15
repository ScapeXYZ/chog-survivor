import {act, cleanup, renderHook, waitFor} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import type {Address} from 'viem'
vi.mock('./contracts', async original => ({...await original<typeof import('./contracts')>(), activeChain: {id: 31338}, approvedGameAddress: '0x3333333333333333333333333333333333333333'}))
import {CHOG_GENESIS} from './contracts'
import {readAdventureAvailability, useAdventureAvailability} from './useAdventureAvailability'
const A = '0x1111111111111111111111111111111111111111' as Address
const B = '0x2222222222222222222222222222222222222222' as Address
const fixture = (day = 100n, canAct = true) => ({day, eventId: 1, choiceId: 1, outcomeId: 1, xpDelta: 12, trustDelta: 5, scarsDelta: 0, xpAfter: 12, trustAfter: 5, scarsAfter: 0, streakAfter: 1, unmarkedStreakAfter: 1, newlyEarnedAchievementMask: 1n, achievementMaskAfter: 1n, titleId: 0, canAct})
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done }); return {promise, resolve} }
const blocks = new Map<bigint, {day: bigint; canAct: boolean; owner: Address}>()
let head = 10n, chainId = 31338, binding = CHOG_GENESIS as string
const block = (number: bigint) => ({number, timestamp: blocks.get(number)!.day * 86400n})
const rpc = {
  getBlock: vi.fn(async () => block(head)), getChainId: vi.fn(async () => chainId),
  readContract: vi.fn(async (request: {functionName: string; blockNumber: bigint; args?: readonly unknown[]}) => {
    const state = blocks.get(request.blockNumber)!
    if (request.functionName === 'CHOG_GENESIS') return binding
    if (request.functionName === 'ownerOf') return state.owner
    if (request.functionName === 'eventFor') return 1
    return fixture(state.day, state.canAct)
  }),
}
const client = rpc as unknown as Parameters<typeof readAdventureAvailability>[0]
function setup() { return renderHook((props: {tokenId: bigint; account: Address; contextKey: string; enabled: boolean}) => useAdventureAvailability({client, ...props}), {initialProps: {tokenId: 1001n, account: A, contextKey: 'wallet-A:1001', enabled: true}}) }
beforeEach(() => {
  vi.clearAllMocks(); head = 10n; chainId = 31338; binding = CHOG_GENESIS
  blocks.clear(); blocks.set(10n, {day: 100n, canAct: true, owner: A}); blocks.set(11n, {day: 101n, canAct: false, owner: A})
  rpc.getBlock.mockImplementation(async () => block(head))
})
afterEach(cleanup)
describe('contract-authoritative adventure availability', () => {
  it('pins ownership, collection and preview to the same block and takes canAct directly from the contract', async () => {
    blocks.get(10n)!.canAct = false
    const result = await readAdventureAvailability(client, 1001n, A)
    expect(result.preview!.canAct).toBe(false); expect(result.preview!.day).toBe(100n)
    expect(rpc.readContract.mock.calls.every(([request]) => request.blockNumber === 10n)).toBe(true)
    expect(rpc.readContract.mock.calls.find(([request]) => request.functionName === 'preview')![0].args).toEqual([1001n, 1])
  })
  it.each(['chain', 'binding', 'owner'])('fails closed on a changed %s without reading an unauthorized preview', async failure => {
    if (failure === 'chain') chainId = 143
    if (failure === 'binding') binding = B
    if (failure === 'owner') blocks.get(10n)!.owner = B
    await expect(readAdventureAvailability(client, 1001n, A)).rejects.toThrow()
    expect(rpc.readContract.mock.calls.some(([request]) => request.functionName === 'preview')).toBe(false)
  })
  it('keeps transferred survivors publicly readable without requesting a non-owner preview', async () => {
    blocks.get(10n)!.owner = B
    const result = await readAdventureAvailability(client, 1001n, A, 0n, B)
    expect(result).toEqual({blockNumber: 10n, day: 100n, eventId: 1})
    expect(rpc.readContract.mock.calls.some(([request]) => request.functionName === 'preview')).toBe(false)
  })
  it('rejects a preview from a different UTC day', async () => {
    rpc.readContract.mockImplementationOnce(async () => binding)
      .mockImplementationOnce(async () => A)
      .mockImplementationOnce(async () => fixture(99n))
    await expect(readAdventureAvailability(client, 1001n, A)).rejects.toThrow(/verified block/)
  })
  it('refreshes the execution-day lock immediately, without a timer or device clock', async () => {
    const view = setup()
    await waitFor(() => expect(view.result.current.snapshot?.preview?.canAct).toBe(true))
    head = 11n
    await act(async () => { expect(await view.result.current.refresh({minimumBlock: 11n, invalidate: true})).toBe(true) })
    expect(view.result.current.snapshot?.preview).toMatchObject({day: 101n, canAct: false})
  })
  it('does not let a slow old-day poll overwrite the confirmed-day refresh', async () => {
    const view = setup(); await waitFor(() => expect(view.result.current.snapshot).toBeDefined())
    const old = deferred<ReturnType<typeof block>>()
    rpc.getBlock.mockReturnValueOnce(old.promise)
    let oldRequest!: Promise<boolean>
    act(() => { oldRequest = view.result.current.refresh() })
    head = 11n
    await act(async () => { await view.result.current.refresh({minimumBlock: 11n, invalidate: true}) })
    await act(async () => { old.resolve(block(10n)); expect(await oldRequest).toBe(false) })
    expect(view.result.current.snapshot).toMatchObject({blockNumber: 11n, preview: {day: 101n, canAct: false}})
  })
  it('keeps eligibility unavailable if RPC is behind the receipt, then recovers with a verified read', async () => {
    const view = setup(); await waitFor(() => expect(view.result.current.snapshot).toBeDefined())
    await act(async () => { expect(await view.result.current.refresh({minimumBlock: 11n, invalidate: true})).toBe(false) })
    expect(view.result.current.snapshot).toBeUndefined(); expect(view.result.current.error).toMatch(/confirmed block/)
    head = 11n
    await act(async () => { await view.result.current.refresh() })
    expect(view.result.current.snapshot?.preview?.canAct).toBe(false)
  })
  it('cannot unlock a later UTC day without a successful new contract preview', async () => {
    blocks.set(12n, {day: 102n, canAct: true, owner: A})
    head = 11n
    const view = setup(); await waitFor(() => expect(view.result.current.snapshot?.preview?.canAct).toBe(false))
    head = 12n
    await act(async () => { await view.result.current.refresh() })
    expect(view.result.current.snapshot?.preview).toMatchObject({day: 102n, canAct: true})
  })
  it.each(['wallet', 'token', 'owner'])('rejects a late response after %s context changes', async change => {
    const view = setup(); await waitFor(() => expect(view.result.current.snapshot).toBeDefined())
    const old = deferred<ReturnType<typeof block>>()
    rpc.getBlock.mockReturnValueOnce(old.promise)
    let request!: Promise<boolean>
    act(() => { request = view.result.current.refresh() })
    head = 11n; blocks.get(11n)!.owner = B
    view.rerender({tokenId: change === 'token' ? 1002n : 1001n, account: B, contextKey: `${change}:new-context`, enabled: true})
    await waitFor(() => expect(view.result.current.snapshot?.blockNumber).toBe(11n))
    await act(async () => { old.resolve(block(10n)); await request })
    expect(view.result.current.snapshot).toMatchObject({blockNumber: 11n, preview: {canAct: false}})
  })
  it('hides cached availability immediately on disconnect or failed verification', async () => {
    const view = setup(); await waitFor(() => expect(view.result.current.snapshot).toBeDefined())
    view.rerender({tokenId: 1001n, account: A, contextKey: 'wallet-A:1001', enabled: false})
    expect(view.result.current.snapshot).toBeUndefined()
  })
  it('clears eligibility on a failed RPC and retries on focus', async () => {
    const view = setup(); await waitFor(() => expect(view.result.current.snapshot).toBeDefined())
    rpc.getBlock.mockRejectedValueOnce(new Error('RPC unavailable'))
    await act(async () => { await view.result.current.refresh() })
    expect(view.result.current.snapshot).toBeUndefined()
    act(() => window.dispatchEvent(new Event('focus')))
    await waitFor(() => expect(view.result.current.snapshot?.preview?.canAct).toBe(true))
  })
})
