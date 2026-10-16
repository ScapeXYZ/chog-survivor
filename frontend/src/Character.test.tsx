import {useState} from 'react'
import {cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {toFunctionSelector} from 'viem'

const fixture = vi.hoisted(() => ({
  account: '0x1234567890123456789012345678901234567890', connected: true, chain: 143 as number | undefined,
  gameAddress: undefined as `0x${string}` | undefined,
  responses: {} as Record<string, Record<string, unknown>>,
  read: vi.fn(), refresh: vi.fn(), write: vi.fn(), sign: vi.fn(), send: vi.fn(),
}))
vi.mock('./contracts', async (original) => ({
  ...await original<typeof import('./contracts')>(),
  get approvedGameAddress() { return fixture.gameAddress },
}))
vi.mock('wagmi', async (original) => ({
  ...await original<typeof import('wagmi')>(),
  usePublicClient: () => undefined,
  useAccount: () => ({address: fixture.connected ? fixture.account : undefined, isConnected: fixture.connected, chainId: fixture.chain}),
  useChainId: () => 143, // Configured chain may remain Monad while the connected wallet is elsewhere.
  useReadContract: (request: {functionName: string; query: {enabled: boolean}}) => {
    fixture.read(request)
    return {data: undefined, isError: false, isLoading: false, isFetching: false, refetch: () => fixture.refresh(request.functionName), ...fixture.responses[request.functionName]}
  },
  useWriteContract: () => ({writeContract: fixture.write}),
  useSignMessage: () => ({signMessage: fixture.sign}),
  useSendTransaction: () => ({sendTransaction: fixture.send}),
}))
import {Character} from './Character'
import {CHOG_GENESIS, gameReadAbi} from './contracts'

const state = {xp: 623, trust: 84, scars: 21, streak: 8, unmarkedStreak: 6,
  lastActionDay: 20740n, lastOutcomeId: 11, eventMask: 0b001001, achievementMask: 0b01000101n, hasActed: true}
function Harness() {
  const [token, setToken] = useState<bigint>()
  return <Character selectedToken={token} onSelectToken={setToken}/>
}
function requests(name: string) { return fixture.read.mock.calls.map(([request]) => request).filter((request) => request.functionName === name) }
function latest(name: string) { return requests(name).at(-1) }
function live() {
  // Test-only responses, never a shipped game deployment configuration.
  fixture.gameAddress = '0x1111111111111111111111111111111111111111'
  fixture.responses = {ownerOf: {data: fixture.account}, CHOG_GENESIS: {data: CHOG_GENESIS}, characterOf: {data: state}, titleOf: {data: 3}}
}
beforeEach(() => {
  vi.clearAllMocks()
  fixture.account = '0x1234567890123456789012345678901234567890'; fixture.connected = true; fixture.chain = 143
  fixture.gameAddress = undefined; fixture.responses = {}; fixture.refresh.mockImplementation((method: string) => Promise.resolve({...fixture.responses[method]}))
})
afterEach(cleanup)

describe('survivor identity and ownership', () => {
  it('separates entered and requested IDs from verified identity', () => {
    render(<Harness/>)
    fireEvent.change(screen.getByLabelText('Token ID'), {target: {value: '1425'}})
    expect(screen.queryByText(/Requested ID/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: 'Check token'}))
    expect(screen.getByText('Requested ID: 1425')).toBeInTheDocument()
    expect(screen.queryByRole('heading', {name: 'CHOG #1425'})).not.toBeInTheDocument()
    expect(latest('ownerOf')).toMatchObject({address: CHOG_GENESIS, args: [1425n], chainId: 143, query: {enabled: true}})
  })
  it('disables ownership-sensitive reads when disconnected', () => {
    fixture.connected = false
    render(<Character selectedToken={1425n} onSelectToken={vi.fn()}/>)
    expect(screen.getByText(/Wallet disconnected/)).toBeInTheDocument()
    expect(latest('ownerOf').query.enabled).toBe(false)
    expect(screen.getByRole('button', {name: /Refresh ownership/})).toBeDisabled()
    expect(screen.queryByText(/zero Chogs/i)).not.toBeInTheDocument()
  })
  it('gates identity and game reads on Monad even with cached data', () => {
    live(); fixture.chain = 1
    render(<Character selectedToken={1425n} onSelectToken={vi.fn()}/>)
    expect(screen.getByText(/Wrong network/)).toBeInTheDocument()
    for (const name of ['ownerOf', 'CHOG_GENESIS', 'characterOf', 'titleOf']) expect(latest(name).query.enabled).toBe(false)
    expect(screen.queryByText('Mythic Survivor')).not.toBeInTheDocument()
  })
  it('does not use the configured chain as proof of an unknown wallet network', () => {
    fixture.chain = undefined
    render(<Character selectedToken={1425n} onSelectToken={vi.fn()}/>)
    expect(screen.getByText(/Wallet network unavailable/)).toBeInTheDocument()
    expect(latest('ownerOf').query.enabled).toBe(false)
  })
  it.each([true, false])('renders verified controller status (owns=%s)', (owns) => {
    fixture.responses.ownerOf = {data: owns ? fixture.account : '0x2222222222222222222222222222222222222222'}
    render(<Character selectedToken={1425n} onSelectToken={vi.fn()}/>)
    expect(screen.getByRole('heading', {name: 'CHOG #1425'})).toBeInTheDocument()
    expect(screen.getByText(owns ? /You control this survivor/ : /Another wallet controls/)).toBeInTheDocument()
    expect(screen.getByText('Current verified owner')).toBeInTheDocument()
  })
  it('shows loading instead of cached identity or progression', () => {
    live(); fixture.responses.ownerOf = {data: fixture.account, isFetching: true}
    render(<Character selectedToken={1425n} onSelectToken={vi.fn()}/>)
    expect(screen.getByText(/Checking canonical ownerOf/)).toBeInTheDocument()
    expect(screen.queryByRole('heading', {name: 'CHOG #1425'})).not.toBeInTheDocument()
    expect(screen.queryByText('623')).not.toBeInTheDocument()
  })
  it('identifies an explicit nonexistent-token error', () => {
    fixture.responses.ownerOf = {isError: true, error: {cause: {data: {errorName: 'ERC721NonexistentToken'}}}}
    render(<Character selectedToken={1425n} onSelectToken={vi.fn()}/>)
    expect(screen.getByText(/NFT nonexistent/)).toBeInTheDocument()
    expect(latest('characterOf').query.enabled).toBe(false)
  })
  it('recognizes raw ERC721NonexistentToken revert data without changing the ABI', () => {
    fixture.responses.ownerOf = {isError: true, error: {cause: {raw: toFunctionSelector('ERC721NonexistentToken(uint256)') + '0'.repeat(64)}}}
    render(<Character selectedToken={1425n} onSelectToken={vi.fn()}/>)
    expect(screen.getByText(/NFT nonexistent/)).toBeInTheDocument()
  })
  it('does not infer nonexistence from an ambiguous collection revert', () => {
    fixture.responses.ownerOf = {isError: true, error: {cause: {name: 'ContractFunctionRevertedError'}}}
    render(<Character selectedToken={1425n} onSelectToken={vi.fn()}/>)
    expect(screen.getByText(/cannot be distinguished/)).toBeInTheDocument()
    expect(screen.queryByText(/^NFT nonexistent/)).not.toBeInTheDocument()
  })
  it('offers retry after RPC failure and recovers verified identity', async () => {
    fixture.responses.ownerOf = {isError: true, error: new Error('RPC unavailable')}
    const view = render(<Character selectedToken={1425n} onSelectToken={vi.fn()}/>)
    expect(screen.getByText(/RPC failure/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: /Refresh ownership/}))
    await waitFor(() => expect(fixture.refresh).toHaveBeenCalledOnce())
    fixture.responses.ownerOf = {data: fixture.account}
    view.rerender(<Character selectedToken={1425n} onSelectToken={vi.fn()}/>)
    expect(screen.getByText(/You control this survivor/)).toBeInTheDocument()
  })
  it('uses a new query scope after account and chain changes and hides stale data', () => {
    live()
    const view = render(<Character selectedToken={1425n} onSelectToken={vi.fn()}/>)
    const scope = latest('ownerOf').scopeKey
    fixture.account = '0x2222222222222222222222222222222222222222'
    fixture.responses.ownerOf = {isFetching: true}
    view.rerender(<Character selectedToken={1425n} onSelectToken={vi.fn()}/>)
    expect(latest('ownerOf').scopeKey).not.toBe(scope)
    expect(screen.queryByText('623')).not.toBeInTheDocument()
    fixture.chain = 1
    view.rerender(<Character selectedToken={1425n} onSelectToken={vi.fn()}/>)
    expect(latest('ownerOf').query.enabled).toBe(false)
    fixture.chain = 143; fixture.responses.ownerOf = {data: fixture.account}
    view.rerender(<Character selectedToken={1425n} onSelectToken={vi.fn()}/>)
    expect(latest('ownerOf')).toMatchObject({query: {enabled: true, staleTime: 0, refetchOnMount: 'always', refetchInterval: 30000}})
    expect(screen.getByText(/You control this survivor/)).toBeInTheDocument()
  })
  it('handles transfer to another controller without changing survivor ID', () => {
    fixture.responses.ownerOf = {data: fixture.account}
    const view = render(<Character selectedToken={1425n} onSelectToken={vi.fn()}/>)
    fixture.responses.ownerOf = {data: '0x2222222222222222222222222222222222222222'}
    view.rerender(<Character selectedToken={1425n} onSelectToken={vi.fn()}/>)
    expect(screen.getByRole('heading', {name: 'CHOG #1425'})).toBeInTheDocument()
    expect(screen.getByText(/Another wallet controls/)).toBeInTheDocument()
  })
  it('does not verify a zero-address owner', () => {
    fixture.responses.ownerOf = {data: '0x0000000000000000000000000000000000000000'}
    render(<Character selectedToken={1425n} onSelectToken={vi.fn()}/>)
    expect(screen.getByText(/returned a zero owner/)).toBeInTheDocument()
    expect(screen.queryByText('VERIFIED NFT IDENTITY')).not.toBeInTheDocument()
  })
})

describe('authoritative progression and unavailable states', () => {
  it('keeps the decorative portrait separate from verified NFT artwork', () => {
    live()
    render(<Character selectedToken={1425n} onSelectToken={vi.fn()}/>)
    const portrait = screen.getByRole('figure', {name: 'Decorative portrait placeholder'})
    expect(within(portrait).getByText(/Portrait unavailable/)).toBeInTheDocument()
    expect(portrait.querySelector('img')).toBeNull()
    expect(screen.getByRole('heading', {name: 'CHOG #1425'})).toBeInTheDocument()
  })
  it('does not represent unavailable progression as zero-value meters or locked achievements', () => {
    render(<Character selectedToken={1425n} onSelectToken={vi.fn()}/>)
    expect(screen.queryByRole('meter')).not.toBeInTheDocument()
    const marks = screen.getByRole('heading', {name: 'Marks of survival'}).closest('section')!
    expect(within(marks).getAllByText('Unavailable')).toHaveLength(8)
    expect(within(marks).queryByText('Not earned')).not.toBeInTheDocument()
  })
  it('limits progression meters to actual bounded Trust and Scars readings', () => {
    live()
    render(<Character selectedToken={1425n} onSelectToken={vi.fn()}/>)
    expect(screen.getAllByRole('meter')).toHaveLength(2)
    expect(screen.getByRole('meter', {name: 'Trust'})).toHaveAttribute('value', '84')
    expect(screen.getByRole('meter', {name: 'Scars'})).toHaveAttribute('value', '21')
    for (const meter of screen.getAllByRole('meter')) {
      expect(meter).toHaveAttribute('min', '0')
      expect(meter).toHaveAttribute('max', '100')
    }
    expect(screen.queryByRole('meter', {name: 'XP'})).not.toBeInTheDocument()
    expect(screen.queryByRole('meter', {name: 'Stored streak'})).not.toBeInTheDocument()
  })
  it('never substitutes Adventure fixtures or invents a timeline without a deployment', () => {
    render(<Character selectedToken={1425n} onSelectToken={vi.fn()}/>)
    expect(screen.getByText(/Progression unavailable — contract-backed gameplay is not enabled/)).toBeInTheDocument()
    expect(screen.queryByText('184')).not.toBeInTheDocument()
    expect(screen.queryByText('62/100')).not.toBeInTheDocument()
    const history = screen.getByRole('heading', {name: 'Survival History'}).closest('section')!
    expect(within(history).getByText(/No timeline has been loaded/)).toBeInTheDocument()
    expect(history.querySelector('ol, ul, time')).toBeNull()
  })
  it('retrieves actual title and maps every CharacterView field', () => {
    live(); render(<Character selectedToken={1425n} onSelectToken={vi.fn()}/>)
    expect(latest('titleOf')).toMatchObject({functionName: 'titleOf', args: [1425n], query: {enabled: true}})
    expect(screen.getByText('Mythic Survivor')).toBeInTheDocument()
    for (const text of ['623', '84/100', '21/100', '8 days']) expect(screen.getByText(text)).toBeInTheDocument()
    expect(screen.getByText(/Unmarked run: 6\/7/)).toBeInTheDocument()
    expect(screen.getByText(/UTC day 20740 · Ancient Gate · Open it for all \(outcome 11\)/)).toBeInTheDocument()
    expect(screen.getByText('Recorded encounter types: Broken Bridge, Ancient Gate.')).toBeInTheDocument()
    const badges = screen.getByRole('heading', {name: 'Marks of survival'}).closest('section')!
    expect(within(badges).getAllByText('Earned')).toHaveLength(3)
    expect(within(badges).getAllByText('Not earned')).toHaveLength(5)
    expect(screen.getByText(/Daily availability/).nextElementSibling).toHaveTextContent('Unverified')
  })
  it('maps a never-acted character without inventing a day-zero action', () => {
    live(); fixture.responses.characterOf = {data: {...state, hasActed: false, lastActionDay: 0n, lastOutcomeId: 0}}
    render(<Character selectedToken={1425n} onSelectToken={vi.fn()}/>)
    expect(screen.getByText('No action recorded in this game contract.')).toBeInTheDocument()
    expect(screen.queryByText(/UTC day 0/)).not.toBeInTheDocument()
  })
  it.each(['CHOG_GENESIS', 'characterOf', 'titleOf'])('handles %s read failure without fallback data', (method) => {
    live(); fixture.responses[method] = {data: fixture.responses[method].data, isError: true}
    render(<Character selectedToken={1425n} onSelectToken={vi.fn()}/>)
    expect(screen.getByText(method === 'CHOG_GENESIS' ? /Game binding read failed/ : method === 'characterOf' ? /Progression read failed/ : /Title read failed/)).toBeInTheDocument()
    if (method !== 'titleOf') expect(screen.queryByText('623')).not.toBeInTheDocument()
    expect(screen.queryByText('184')).not.toBeInTheDocument()
    expect(screen.queryByText('Wandering Chog')).not.toBeInTheDocument()
  })
  it('rejects a mismatched game binding', () => {
    live(); fixture.responses.CHOG_GENESIS = {data: fixture.account}
    render(<Character selectedToken={1425n} onSelectToken={vi.fn()}/>)
    expect(screen.getByText(/Game binding unavailable or mismatched/)).toBeInTheDocument()
    expect(latest('characterOf').query.enabled).toBe(false)
    expect(screen.queryByText('623')).not.toBeInTheDocument()
  })
  it('shows unavailable stats while progression refetches, not cached stats', () => {
    live(); fixture.responses.characterOf = {data: state, isFetching: true}
    render(<Character selectedToken={1425n} onSelectToken={vi.fn()}/>)
    expect(screen.getByText(/Reading recorded survivor state/)).toBeInTheDocument()
    expect(screen.queryByText('623')).not.toBeInTheDocument()
  })
  it('refreshes enabled read paths without writes, signatures or broadcasts', async () => {
    live(); render(<Character selectedToken={1425n} onSelectToken={vi.fn()}/>)
    fireEvent.click(screen.getByRole('button', {name: /Refresh ownership/}))
    await waitFor(() => expect(fixture.refresh).toHaveBeenCalledTimes(4))
    expect(fixture.write).not.toHaveBeenCalled(); expect(fixture.sign).not.toHaveBeenCalled(); expect(fixture.send).not.toHaveBeenCalled()
    expect(gameReadAbi.every((entry) => entry.stateMutability === 'view')).toBe(true)
    expect(fixture.read.mock.calls.every(([request]) => ['ownerOf', 'tokenURI', 'CHOG_GENESIS', 'characterOf', 'titleOf'].includes(request.functionName))).toBe(true)
  })
  it('stops a refresh before game reads if fresh ownership fails', async () => {
    live(); fixture.refresh.mockResolvedValueOnce({isError: true})
    render(<Character selectedToken={1425n} onSelectToken={vi.fn()}/>)
    fireEvent.click(screen.getByRole('button', {name: /Refresh ownership/}))
    await waitFor(() => expect(fixture.refresh).toHaveBeenCalledOnce())
    expect(fixture.refresh).toHaveBeenCalledWith('ownerOf')
  })
  it('abandons pending refresh when the wallet account changes', async () => {
    live()
    let finish!: (value: unknown) => void
    fixture.refresh.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve }))
    const view = render(<Character selectedToken={1425n} onSelectToken={vi.fn()}/>)
    fireEvent.click(screen.getByRole('button', {name: /Refresh ownership/}))
    fixture.account = '0x2222222222222222222222222222222222222222'
    view.rerender(<Character selectedToken={1425n} onSelectToken={vi.fn()}/>)
    finish({data: '0x1234567890123456789012345678901234567890'})
    await waitFor(() => expect(fixture.refresh).toHaveBeenCalledOnce())
  })
})
