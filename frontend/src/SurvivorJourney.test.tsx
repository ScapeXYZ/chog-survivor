import {cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

const wallet = vi.hoisted(() => ({
  account: '0x1234567890123456789012345678901234567890', connected: true,
  chain: 143 as number | undefined,
  owners: {} as Record<string, Record<string, unknown>>,
  read: vi.fn(), refresh: vi.fn(), write: vi.fn(), sign: vi.fn(), send: vi.fn(),
}))
vi.mock('wagmi', async (original) => ({
  ...await original<typeof import('wagmi')>(),
  usePublicClient: () => undefined,
  useAccount: () => ({address: wallet.connected ? wallet.account : undefined, isConnected: wallet.connected, chainId: wallet.chain}),
  useChainId: () => 143,
  useConnect: () => ({connect: vi.fn(), connectors: [], isPending: false}),
  useDisconnect: () => ({disconnect: vi.fn()}),
  useReadContract: (request: {functionName: string; args?: readonly bigint[]}) => {
    wallet.read(request)
    return {data: undefined, isError: false, isLoading: false, isFetching: false,
      refetch: () => wallet.refresh(request.args?.[0]),
      ...(request.functionName === 'ownerOf' ? wallet.owners[String(request.args?.[0])] : {})}
  },
  useWriteContract: () => ({writeContract: wallet.write}),
  useSignMessage: () => ({signMessage: wallet.sign}),
  useSendTransaction: () => ({sendTransaction: wallet.send}),
}))
// Identity/discovery unit fixtures; runtime proof has dedicated fail-closed tests.
vi.mock('./useVerifiedDeployment', () => ({useVerifiedDeployment: () => ({verified: true, loading: false, error: undefined})}))
import {App} from './App'
import {Adventure} from './Adventure'
import {CHOG_GENESIS} from './contracts'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
})
beforeEach(() => {
  vi.clearAllMocks()
  wallet.account = '0x1234567890123456789012345678901234567890'
  wallet.connected = true; wallet.chain = 143; wallet.owners = {}
  wallet.refresh.mockImplementation((token) => Promise.resolve(wallet.owners[String(token)]))
})
afterEach(cleanup)
function strip() { return screen.getByRole('complementary', {name: 'Adventure survivor identity'}) }
function lookup(value = '1425') {
  fireEvent.click(screen.getByRole('button', {name: /^character$/i}))
  fireEvent.change(screen.getByLabelText('Token ID'), {target: {value}})
  fireEvent.click(screen.getByRole('button', {name: 'Check token'}))
}
function adventure() { fireEvent.click(screen.getByRole('button', {name: /^adventure$/i})) }
function latestOwner() { return wallet.read.mock.calls.map(([request]) => request).filter((request) => request.functionName === 'ownerOf').at(-1) }

// These are read-response mocks, not live ownership or transfer evidence.
describe('shared survivor journey', () => {
  it('lets a disconnected visitor explore and return to Character without a selected token', () => {
    wallet.connected = false
    render(<App/>)
    fireEvent.click(screen.getByRole('button', {name: /^play with your nft/i}))
    expect(strip()).toHaveTextContent('No verified Chog selected')
    expect(strip()).toHaveTextContent('Wallet disconnected')
    expect(strip()).toHaveTextContent('NO VERIFIED SURVIVOR')
    expect(latestOwner().query.enabled).toBe(false)
    expect(screen.queryByRole('button', {name: /Preview Choice/})).not.toBeInTheDocument()
    fireEvent.click(within(strip()).getByRole('button', {name: /View survivor profile/}))
    expect(screen.getByRole('heading', {name: 'A Chog. A story.'})).toBeInTheDocument()
  })
  it('does not claim NFT identity from an unsubmitted manual entry', () => {
    render(<App/>)
    fireEvent.click(screen.getByRole('button', {name: /^character$/i}))
    fireEvent.change(screen.getByLabelText('Token ID'), {target: {value: '1425'}})
    adventure()
    expect(strip()).toHaveTextContent('No verified Chog selected')
    expect(latestOwner().args).toBeUndefined()
    expect(latestOwner().query.enabled).toBe(false)
  })
  it('keeps submitted but pending identity unverified in both directions', () => {
    render(<App/>); lookup(); adventure()
    expect(strip()).toHaveTextContent('Requested token #1425 · unverified')
    expect(strip()).not.toHaveTextContent('VERIFIED NFT IDENTITY')
    expect(latestOwner()).toMatchObject({address: CHOG_GENESIS, args: [1425n], chainId: 143, query: {enabled: true}})
    fireEvent.click(within(strip()).getByRole('button', {name: /View survivor profile/}))
    expect(screen.getByLabelText('Token ID')).toHaveValue('1425')
    expect(screen.getByText('Requested ID: 1425')).toBeInTheDocument()
    expect(screen.queryByRole('heading', {name: 'CHOG #1425'})).not.toBeInTheDocument()
  })
  it.each([true, false])('shares verified NFT identity and controller status (owned=%s)', (owned) => {
    wallet.owners['1425'] = {data: owned ? wallet.account : '0x2222222222222222222222222222222222222222'}
    render(<App/>); lookup()
    expect(screen.getByRole('heading', {name: 'CHOG #1425'})).toBeInTheDocument()
    const characterRead = latestOwner()
    adventure()
    expect(strip()).toHaveTextContent('CHOG #1425')
    expect(strip()).toHaveTextContent(owned ? 'VERIFIED NFT IDENTITY' : 'CHOG #1425 · CONTROLLED BY ANOTHER WALLET')
    expect(strip()).toHaveTextContent(owned ? 'You control this survivor' : 'Your connected wallet does not own this Chog')
    expect(latestOwner()).toMatchObject({scopeKey: characterRead.scopeKey, args: characterRead.args})
    fireEvent.click(within(strip()).getByRole('button', {name: owned ? /View survivor profile/ : /View Survivor History/}))
    if (!owned) expect(screen.getByRole('heading', {name: 'Survival History'})).toHaveFocus()
    expect(screen.getByRole('heading', {name: 'CHOG #1425'})).toBeInTheDocument()
    expect(screen.queryByText('184')).not.toBeInTheDocument()
  })
  it('finds wallet Chogs through the existing Character screen', () => {
    wallet.owners['1425'] = {data: '0x2222222222222222222222222222222222222222'}
    render(<App/>); lookup(); adventure()
    fireEvent.click(screen.getByRole('button', {name: /Find My Chogs/}))
    expect(screen.getByRole('heading', {name: 'Your Survivors'})).toHaveFocus()
    expect(screen.getByLabelText('Token ID')).toHaveValue('1425')
    expect(wallet.write).not.toHaveBeenCalled()
  })
  it('gates cached ownership on the connected wallet chain, including network changes', () => {
    wallet.owners['1425'] = {data: wallet.account}
    const view = render(<App/>); lookup(); adventure()
    wallet.chain = 1; view.rerender(<App/>)
    expect(strip()).toHaveTextContent('Wrong network')
    expect(strip()).not.toHaveTextContent('VERIFIED NFT IDENTITY')
    expect(latestOwner().query.enabled).toBe(false)
    wallet.chain = 143; wallet.owners['1425'] = {data: wallet.account, isFetching: true}; view.rerender(<App/>)
    expect(strip()).toHaveTextContent('Identity is not yet verified')
    wallet.owners['1425'] = {data: wallet.account}; view.rerender(<App/>)
    expect(strip()).toHaveTextContent('VERIFIED NFT IDENTITY')
  })
  it('hides cached identity after disconnection or loss of wallet network information', () => {
    wallet.owners['1425'] = {data: wallet.account}
    const view = render(<App/>); lookup(); adventure()
    wallet.connected = false; view.rerender(<App/>)
    expect(strip()).toHaveTextContent('Wallet disconnected')
    expect(strip()).not.toHaveTextContent('VERIFIED NFT IDENTITY')
    wallet.connected = true; wallet.chain = undefined; view.rerender(<App/>)
    expect(strip()).toHaveTextContent('Wallet network unavailable')
    expect(latestOwner().query.enabled).toBe(false)
  })
  it('offers retry after an RPC failure without accepting cached ownership', async () => {
    wallet.owners['1425'] = {data: wallet.account, isError: true, error: new Error('RPC failed')}
    const view = render(<App/>); lookup(); adventure()
    expect(strip()).toHaveTextContent('RPC failure')
    expect(strip()).not.toHaveTextContent('VERIFIED NFT IDENTITY')
    fireEvent.click(within(strip()).getByRole('button', {name: 'Refresh ownership'}))
    await waitFor(() => expect(wallet.refresh).toHaveBeenCalledWith(1425n))
    wallet.owners['1425'] = {data: wallet.account}; view.rerender(<App/>)
    expect(strip()).toHaveTextContent('You control this survivor')
  })
  it('uses a fresh query scope after account switching and can verify a different controller', () => {
    wallet.owners['1425'] = {data: wallet.account}
    const view = render(<App/>); lookup(); adventure()
    const scope = latestOwner().scopeKey
    wallet.account = '0x2222222222222222222222222222222222222222'
    wallet.owners['1425'] = {isFetching: true}; view.rerender(<App/>)
    expect(latestOwner().scopeKey).not.toBe(scope)
    expect(strip()).not.toHaveTextContent('You control this survivor')
    wallet.owners['1425'] = {data: '0x1234567890123456789012345678901234567890'}; view.rerender(<App/>)
    expect(strip()).toHaveTextContent('CHOG #1425 · CONTROLLED BY ANOTHER WALLET')
    expect(latestOwner().query).toMatchObject({staleTime: 0, refetchOnMount: 'always', refetchInterval: 30000, refetchOnWindowFocus: true})
  })
  it('rechecks a newly selected token and shares it without carrying over prior ownership', () => {
    wallet.owners['1425'] = {data: wallet.account}
    render(<App/>); lookup(); adventure()
    fireEvent.click(within(strip()).getByRole('button', {name: /View survivor profile/}))
    lookup('1426'); adventure()
    expect(strip()).toHaveTextContent('Requested token #1426 · unverified')
    expect(strip()).not.toHaveTextContent('CHOG #1425')
    expect(latestOwner().args).toEqual([1426n])
    expect(screen.queryByText(/Demo seed/)).not.toBeInTheDocument()
  })
  it('reflects ownership changes while retaining the same survivor token', () => {
    wallet.owners['1425'] = {data: wallet.account}
    const view = render(<App/>); lookup(); adventure()
    wallet.owners['1425'] = {data: '0x2222222222222222222222222222222222222222'}; view.rerender(<App/>)
    expect(strip()).toHaveTextContent('CHOG #1425')
    expect(strip()).toHaveTextContent('CHOG #1425 · CONTROLLED BY ANOTHER WALLET')
    fireEvent.click(within(strip()).getByRole('button', {name: /View Survivor History/}))
    expect(screen.getByText(/Another wallet controls/)).toBeInTheDocument()
  })
  it.each([
    {isFetching: true, data: '0x1234567890123456789012345678901234567890'},
    {isError: true, error: {cause: {data: {errorName: 'ERC721NonexistentToken'}}}},
    {data: '0x0000000000000000000000000000000000000000'},
  ])('does not claim a survivor from unavailable ownership: %j', (response) => {
    wallet.owners['1425'] = response
    render(<App/>); lookup(); adventure()
    expect(strip()).toHaveTextContent('Requested token #1425 · unverified')
    expect(strip()).not.toHaveTextContent('VERIFIED NFT IDENTITY')
    expect(strip()).not.toHaveTextContent('You control this survivor')
  })
  it('never substitutes a simulated encounter or success when game verification is unavailable', () => {
    wallet.owners['1425'] = {data: wallet.account}
    render(<App/>); lookup(); adventure()
    expect(screen.getByLabelText('Recorded survivor statistics')).toHaveTextContent('Unavailable')
    expect(screen.queryByRole('button', {name: /Preview Choice/})).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'On-chain gameplay not yet enabled'})).toBeDisabled()
    for (const fn of [wallet.write, wallet.sign, wallet.send]) expect(fn).not.toHaveBeenCalled()
  })
})
