import {decodeFunctionData, encodeFunctionResult, parseAbi} from 'viem'
import {act, cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

const fixture = vi.hoisted(() => ({
  account: '0x1234567890123456789012345678901234567890' as `0x${string}`, connected: true, chain: 143 as number | undefined,
  balance: 1n, candidates: [1425n], owner: '0x1234567890123456789012345678901234567890',
  fail: '' as string, network: 143, code: '0x1234', blockHash: '0xabcd',
  call: vi.fn(), readContract: vi.fn(), getChainId: vi.fn(), getBlock: vi.fn(), getBytecode: vi.fn(), selectedOwner: vi.fn(),
  write: vi.fn(), sign: vi.fn(), send: vi.fn(),
}))
vi.mock('viem', async original => {
  const actual = await original<typeof import('viem')>()
  return {...actual, keccak256: (data: Parameters<typeof actual.keccak256>[0]) => data === '0x1234' ?
    '0x91aa1fd28371674abeb31670fd694cacaca57ac29cae579452c5150eb5dbab46' : actual.keccak256(data)}
})
vi.mock('wagmi', async original => ({
  ...await original<typeof import('wagmi')>(),
  useAccount: () => ({address: fixture.connected ? fixture.account : undefined, isConnected: fixture.connected, chainId: fixture.chain}),
  usePublicClient: () => ({call: fixture.call, getChainId: fixture.getChainId, getBlock: fixture.getBlock, getBytecode: fixture.getBytecode}),
  useChainId: () => 143,
  useConnect: () => ({connect: vi.fn(), connectors: [], isPending: false}),
  useDisconnect: () => ({disconnect: vi.fn()}),
  useReadContract: (request: {functionName: string; args?: readonly bigint[]}) => {
    fixture.selectedOwner(request)
    return {data: request.functionName === 'ownerOf' ? fixture.owner : undefined, isError: false, isLoading: false, isFetching: false, refetch: vi.fn()}
  },
  useWriteContract: () => ({writeContract: fixture.write}),
  useSignMessage: () => ({signMessage: fixture.sign}),
  useSendTransaction: () => ({sendTransaction: fixture.send}),
}))
import {YourSurvivors} from './YourSurvivors'
import {App} from './App'
import {CHOG_GENESIS} from './contracts'

beforeEach(() => {
  vi.clearAllMocks()
  fixture.account = '0x1234567890123456789012345678901234567890'; fixture.connected = true; fixture.chain = 143
  fixture.balance = 1n; fixture.candidates = [1425n]; fixture.owner = fixture.account
  fixture.fail = ''; fixture.network = 143; fixture.code = '0x1234'; fixture.blockHash = '0xabcd'
  const abi = parseAbi(['function tokensOfOwner(address) view returns (uint256[])', 'function balanceOf(address) view returns (uint256)', 'function ownerOf(uint256) view returns (address)'])
  fixture.call.mockImplementation(async request => {
    const decoded = decodeFunctionData({abi, data: request.data})
    const result = await fixture.readContract({...request, address: request.to, ...decoded})
    return {data: encodeFunctionResult({abi, functionName: decoded.functionName, result})}
  })
  fixture.getChainId.mockImplementation(async () => fixture.network)
  fixture.getBlock.mockImplementation(async () => ({number: 100n, hash: fixture.blockHash}))
  fixture.getBytecode.mockImplementation(async () => fixture.code)
  fixture.readContract.mockImplementation(async (request: {functionName: string}) => {
    if (request.functionName === fixture.fail) throw new Error('RPC unavailable')
    if (request.functionName === 'balanceOf') return fixture.balance
    if (request.functionName === 'tokensOfOwner') return fixture.candidates
    if (request.functionName === 'ownerOf') return fixture.owner
    throw new Error('Unexpected call')
  })
})
afterEach(() => {cleanup(); vi.useRealTimers()})
function start() { fireEvent.click(screen.getByRole('button', {name: /Find my Chogs|Retry discovery/})) }
async function finish() { await waitFor(() => expect(screen.getByRole('button', {name: 'Retry discovery'})).toBeEnabled()) }
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(r => {resolve = r}); return {promise, resolve} }

describe('read-only collection discovery', () => {
  it.each([false, true])('gates disconnected and wrong-chain wallets (connected=%s)', connected => {
    fixture.connected = connected; fixture.chain = 1
    render(<YourSurvivors onSelectToken={vi.fn()}/>)
    expect(screen.getByRole('button', {name: 'Find my Chogs'})).toBeDisabled()
    expect(fixture.readContract).not.toHaveBeenCalled()
    expect(screen.queryByText(/No owned Chogs/)).not.toBeInTheDocument()
  })
  it('does not equate unknown chain or undiscovered holdings with zero', () => {
    fixture.chain = undefined
    render(<YourSurvivors onSelectToken={vi.fn()}/>)
    expect(screen.getByRole('button', {name: 'Find my Chogs'})).toBeDisabled()
    expect(screen.queryByText(/No owned Chogs/)).not.toBeInTheDocument()
  })
  it('only reports empty holdings after successful complete reads', async () => {
    fixture.balance = 0n; fixture.candidates = []
    render(<YourSurvivors onSelectToken={vi.fn()}/>); start(); await finish()
    expect(screen.getByText(/No owned Chogs at finalized block 100/)).toBeInTheDocument()
    expect(fixture.readContract.mock.calls.map(([r]) => r.functionName)).toEqual(['balanceOf', 'tokensOfOwner'])
  })
  it.each([[1425n], [758n, 1047n, 1425n]])('verifies every candidate before showing owned tokens %s', async (...ids) => {
    fixture.candidates = ids; fixture.balance = BigInt(ids.length)
    const select = vi.fn(); render(<YourSurvivors onSelectToken={select}/>); start(); await finish()
    for (const token of ids) expect(screen.getByRole('button', {name: `CHOG #${token}`})).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: `CHOG #${ids[0]}`})); expect(select).toHaveBeenCalledWith(ids[0])
    const requests = fixture.readContract.mock.calls.map(([r]) => r)
    expect(requests.filter(r => r.functionName === 'ownerOf').map(r => r.args[0])).toEqual(ids)
    for (const request of requests) expect(request).toMatchObject({address: CHOG_GENESIS, blockNumber: 100n})
    expect(requests.find(r => r.functionName === 'tokensOfOwner').gas).toBe(50_000_000n)
  })
  it('shows loading without assuming ownership', async () => {
    const pending = deferred<bigint[]>(); fixture.readContract.mockImplementation(async r => r.functionName === 'balanceOf' ? 1n : pending.promise)
    render(<YourSurvivors onSelectToken={vi.fn()}/>); start()
    expect(screen.getByText(/verifying each candidate/)).toBeInTheDocument()
    expect(screen.queryByRole('button', {name: 'CHOG #1425'})).not.toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Finding Chogs…'})).toBeDisabled()
    pending.resolve([]); await finish()
  })
  it('handles RPC failure and explicit retry without fake empty holdings', async () => {
    fixture.fail = 'tokensOfOwner'
    render(<YourSurvivors onSelectToken={vi.fn()}/>); start(); await finish()
    expect(screen.getByText(/Discovery unavailable/)).toBeInTheDocument()
    expect(screen.queryByText(/No owned Chogs/)).not.toBeInTheDocument()
    fixture.fail = ''; start(); await finish()
    expect(screen.getByRole('button', {name: 'CHOG #1425'})).toBeInTheDocument()
  })
  it.each(['ownerOf', 'non-owner'])('does not offer unverified or transferred candidates (%s)', async failure => {
    if (failure === 'ownerOf') fixture.fail = failure
    else fixture.owner = '0x2222222222222222222222222222222222222222'
    render(<YourSurvivors onSelectToken={vi.fn()}/>); start(); await finish()
    expect(screen.getByText(/Partial discovery/)).toBeInTheDocument()
    expect(screen.queryByRole('button', {name: 'CHOG #1425'})).not.toBeInTheDocument()
    expect(screen.queryByText(/No owned Chogs/)).not.toBeInTheDocument()
  })
  it.each(['duplicates', 'missing', 'oversize'])('labels incomplete enumeration (%s)', async kind => {
    fixture.candidates = kind === 'duplicates' ? [1425n, 1425n] : kind === 'oversize' ? Array.from({length: 25}, (_, i) => BigInt(i)) : [1425n]
    fixture.balance = kind === 'oversize' ? 25n : 2n
    render(<YourSurvivors onSelectToken={vi.fn()}/>); start(); await finish()
    expect(screen.getByText(/not a complete inventory/)).toBeInTheDocument()
    expect(fixture.readContract.mock.calls.filter(([r]) => r.functionName === 'ownerOf').length).toBeLessThanOrEqual(24)
  })
  it.each(['account', 'chain', 'token', 'disconnect'])('rejects late results after %s switching', async change => {
    const pending = deferred<bigint[]>(); fixture.readContract.mockImplementation(async r => r.functionName === 'balanceOf' ? 1n : pending.promise)
    const {rerender} = render(<YourSurvivors onSelectToken={vi.fn()}/>); start()
    await waitFor(() => expect(fixture.readContract).toHaveBeenCalledWith(expect.objectContaining({functionName: 'tokensOfOwner'})))
    if (change === 'account') fixture.account = '0x2222222222222222222222222222222222222222'
    if (change === 'chain') fixture.chain = 1
    if (change === 'disconnect') fixture.connected = false
    rerender(<YourSurvivors selectedToken={change === 'token' ? 9n : undefined} onSelectToken={vi.fn()}/>)
    pending.resolve([1425n])
    await waitFor(() => expect(screen.queryByText(/verifying each candidate/)).not.toBeInTheDocument())
    expect(screen.queryByRole('button', {name: 'CHOG #1425'})).not.toBeInTheDocument()
    expect(fixture.readContract.mock.calls.some(([r]) => r.functionName === 'ownerOf')).toBe(false)
  })
  it('hides completed ownership on account change and window focus', async () => {
    const {rerender} = render(<YourSurvivors onSelectToken={vi.fn()}/>); start(); await finish()
    fireEvent(window, new Event('focus'))
    expect(screen.queryByRole('button', {name: 'CHOG #1425'})).not.toBeInTheDocument()
    start(); await finish(); fixture.account = '0x2222222222222222222222222222222222222222'
    rerender(<YourSurvivors onSelectToken={vi.fn()}/>)
    expect(screen.queryByRole('button', {name: 'CHOG #1425'})).not.toBeInTheDocument()
  })
  it('detects ownership transfer on retry and removes the old survivor', async () => {
    render(<YourSurvivors onSelectToken={vi.fn()}/>); start(); await finish()
    fixture.balance = 0n; fixture.candidates = []; start(); await finish()
    expect(screen.queryByRole('button', {name: 'CHOG #1425'})).not.toBeInTheDocument()
    expect(screen.getByText(/No owned Chogs at/)).toBeInTheDocument()
  })
  it('expires snapshots after thirty seconds without repeating the expensive getter', async () => {
    vi.useFakeTimers()
    render(<YourSurvivors onSelectToken={vi.fn()}/>); start()
    await act(async () => { await vi.advanceTimersByTimeAsync(0) })
    expect(screen.getByRole('button', {name: 'CHOG #1425'})).toBeInTheDocument()
    const requests = fixture.call.mock.calls.length
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000) })
    expect(screen.queryByRole('button', {name: 'CHOG #1425'})).not.toBeInTheDocument()
    expect(fixture.call).toHaveBeenCalledTimes(requests)
  })
  it('bounds a hanging request and ignores its eventual response', async () => {
    vi.useFakeTimers()
    const pending = deferred<number>(); fixture.getChainId.mockReturnValue(pending.promise)
    render(<YourSurvivors onSelectToken={vi.fn()}/>); start()
    await act(async () => { await vi.advanceTimersByTimeAsync(20_000) })
    expect(screen.getByText(/Discovery unavailable/)).toBeInTheDocument()
    pending.resolve(143); await act(async () => { await vi.advanceTimersByTimeAsync(0) })
    expect(fixture.call).not.toHaveBeenCalled()
  })
  it.each(['network', 'code', 'block'])('fails closed when %s evidence changes', async kind => {
    if (kind === 'network') fixture.network = 1
    if (kind === 'code') fixture.code = '0xdead'
    if (kind === 'block') fixture.getBlock.mockResolvedValueOnce({number: 100n, hash: '0xaaaa'})
    render(<YourSurvivors onSelectToken={vi.fn()}/>); start(); await finish()
    expect(screen.getByText(/Discovery unavailable/)).toBeInTheDocument()
    expect(screen.queryByRole('button', {name: 'CHOG #1425'})).not.toBeInTheDocument()
  })
  it('preserves discovered selection, manual fallback and demo-only Adventure continuity without writes', async () => {
    render(<App/>); fireEvent.click(screen.getByRole('button', {name: 'character'})); start(); await finish()
    fireEvent.click(screen.getByRole('button', {name: 'CHOG #1425'}))
    expect(screen.getByLabelText('Token ID')).toHaveValue('1425')
    expect(screen.getByRole('heading', {name: 'CHOG #1425'})).toBeInTheDocument()
    expect(fixture.selectedOwner).toHaveBeenCalledWith(expect.objectContaining({functionName: 'ownerOf', args: [1425n]}))
    fireEvent.click(screen.getByRole('button', {name: 'adventure'}))
    const strip = document.querySelector('.adventure-survivor') as HTMLElement
    expect(within(strip).getByText('CHOG #1425')).toBeInTheDocument()
    expect(within(strip).getByText(/LOCAL DEMO/)).toBeInTheDocument()
    fireEvent.click(within(strip).getByRole('button', {name: /View survivor profile/}))
    fixture.fail = 'tokensOfOwner'; start(); await finish()
    fireEvent.change(screen.getByLabelText('Token ID'), {target: {value: '1047'}})
    fireEvent.click(screen.getByRole('button', {name: 'Check token'}))
    expect(screen.getByRole('heading', {name: 'CHOG #1047'})).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(document.querySelector('.survivor-history ol,.survivor-history time')).toBeNull()
    for (const action of [fixture.write, fixture.sign, fixture.send]) expect(action).not.toHaveBeenCalled()
    expect(fixture.readContract.mock.calls.every(([r]) => ['balanceOf', 'tokensOfOwner', 'ownerOf'].includes(r.functionName))).toBe(true)
  })
})
