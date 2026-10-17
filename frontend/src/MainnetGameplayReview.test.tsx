import {act, cleanup, fireEvent, render, screen} from '@testing-library/react'
import {afterEach, beforeEach, expect, it, vi} from 'vitest'
const mock = vi.hoisted(() => ({controls: true, contextKey: 'owner:143:1425', prepare: vi.fn(), send: vi.fn()}))
vi.mock('./contracts', async original => ({...await original<typeof import('./contracts')>(), mainnetTransactionsEnabled: true}))
vi.mock('wagmi', async original => ({...await original<typeof import('wagmi')>(), usePublicClient: () => ({}), useWalletClient: () => ({data: {sendTransaction: mock.send}})}))
vi.mock('./mainnetGameplay', async original => ({...await original<typeof import('./mainnetGameplay')>(), prepareAction: mock.prepare}))
vi.mock('./useSurvivorProgress', () => ({useSurvivorProgress: () => ({bound: mock.controls, state: {xp: 0}, identity: {connected: true, onMonad: true, verified: mock.controls, controls: mock.controls, address: '0x1111111111111111111111111111111111111111', contextKey: mock.contextKey, scopeKey: 'owner:143', owner: {data: '0x1111111111111111111111111111111111111111'}}})}))
vi.mock('./useAdventureAvailability', () => ({useAdventureAvailability: () => ({snapshot: {eventId: 1, preview: {canAct: true}}, loading: false})}))
vi.mock('./useNftMetadata', () => ({useNftMetadata: () => ({})}))
import {MainnetGameplayPanel} from './MainnetGameplayPanel'
import {fixture} from '../testing/gameplayFixture'
const t = fixture()
const quote = {...t.intent, data: '0x' as const, preview: t.preview(), nonce: 7, block: 10n, estimatedGas: 200000n, gas: 250000n, maxFeePerGas: 100000000000n, maxPriorityFeePerGas: 1000000000n, maxCost: 25000000000000000n, balance: 1000000000000000000n, createdAt: Date.now()}
beforeEach(() => {
  mock.controls = true; mock.contextKey = 'owner:143:1425'; mock.prepare.mockReset(); mock.send.mockReset(); localStorage.clear()
  HTMLDialogElement.prototype.showModal = function () {this.setAttribute('open', '')}
  HTMLDialogElement.prototype.close = function () {this.removeAttribute('open')}
})
afterEach(() => {cleanup();vi.useRealTimers()})
function start() {const view = render(<MainnetGameplayPanel selectedToken={1425n}/>);fireEvent.click(screen.getAllByRole('button', {name: /Review real contract action/})[0]);return view}
it('opens unsigned review immediately while the real preflight promise is pending', () => {
  mock.prepare.mockReturnValue(new Promise(() => {})); start()
  expect(screen.getByRole('dialog', {name: 'Review real Monad action'})).toHaveTextContent('act(1425, 1)')
  expect(screen.getByRole('button', {name: 'Request wallet confirmation'})).toBeDisabled()
  fireEvent.click(screen.getByRole('button', {name: 'Cancel review'}));expect(mock.send).not.toHaveBeenCalled()
})
it('shows bounded actionable RPC timeout and ignores late success', async () => {
  vi.useFakeTimers();let resolve!: (value: typeof quote) => void
  mock.prepare.mockReturnValue(new Promise(r => {resolve = r}));start()
  await act(async () => {await vi.advanceTimersByTimeAsync(8000)})
  expect(screen.getByRole('dialog')).toHaveTextContent(/timed out.*Retry/i)
  await act(async () => {resolve(quote)})
  expect(screen.getByRole('button', {name: 'Request wallet confirmation'})).toBeDisabled();expect(mock.send).not.toHaveBeenCalled()
})
it('explains verification refresh instead of silently losing the review', async () => {
  let resolve!: (value: typeof quote) => void
  mock.prepare.mockReturnValue(new Promise(r => {resolve = r}));const view = start()
  mock.controls = false;view.rerender(<MainnetGameplayPanel selectedToken={1425n}/>)
  await act(async () => {resolve(quote)})
  expect(screen.getByRole('dialog')).toHaveTextContent(/verification changed.*Retry/i)
  expect(screen.getByRole('button', {name: 'Request wallet confirmation'})).toBeDisabled();expect(mock.send).not.toHaveBeenCalled()
})
it('displays preflight failure in review and never requests a wallet', async () => {
  mock.prepare.mockRejectedValue(Error('Gas estimation failed'));start()
  expect(await screen.findByRole('alert')).toHaveTextContent('Gas estimation failed')
  expect(screen.getByRole('button', {name: 'Request wallet confirmation'})).toBeDisabled();expect(mock.send).not.toHaveBeenCalled()
})
it('enables explicit consent only after a fully verified quote', async () => {
  mock.prepare.mockResolvedValue(quote);start()
  await screen.findByText('200000 / 250000')
  expect(screen.getByRole('dialog')).toHaveTextContent('0.025 MON')
  expect(screen.getByRole('button', {name: 'Request wallet confirmation'})).toBeDisabled()
  fireEvent.click(screen.getByRole('checkbox'));expect(screen.getByRole('button', {name: 'Request wallet confirmation'})).toBeEnabled()
  expect(mock.send).not.toHaveBeenCalled()
})
it('does not resurrect a quote after cancelled preparation', async () => {
  let resolve!: (value: typeof quote) => void
  mock.prepare.mockReturnValue(new Promise(r => {resolve = r}));start()
  fireEvent.click(screen.getByRole('button', {name: 'Cancel review'}))
  await act(async () => {resolve(quote)})
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();expect(mock.send).not.toHaveBeenCalled()
})
it('does not restore consent when verification recovers after invalidation', async () => {
  let resolve!: (value: typeof quote) => void
  mock.prepare.mockReturnValue(new Promise(r => {resolve = r}));const view = start()
  mock.controls = false;view.rerender(<MainnetGameplayPanel selectedToken={1425n}/>)
  mock.controls = true;view.rerender(<MainnetGameplayPanel selectedToken={1425n}/>)
  await act(async () => {resolve(quote)})
  expect(screen.getByRole('dialog')).toHaveTextContent(/verification changed/i)
  expect(screen.getByRole('button', {name: 'Request wallet confirmation'})).toBeDisabled();expect(mock.send).not.toHaveBeenCalled()
})
