import {cleanup, fireEvent, render, screen, within} from '@testing-library/react'
import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'
import {encodePacked, keccak256} from 'viem'

const wallet = vi.hoisted(() => ({
  address: undefined as `0x${string}` | undefined, isConnected: false, chainId: 143,
  connectors: [] as {id: string}[],
  connect: vi.fn(), disconnect: vi.fn(), read: vi.fn(), write: vi.fn(), sign: vi.fn(), send: vi.fn(),
}))
vi.mock('wagmi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('wagmi')>()),
  useAccount: () => ({address: wallet.address, isConnected: wallet.isConnected, chainId: wallet.chainId}),
  useChainId: () => wallet.chainId,
  useConnect: () => ({connect: wallet.connect, connectors: wallet.connectors, isPending: false}),
  useDisconnect: () => ({disconnect: wallet.disconnect}),
  useReadContract: (parameters: unknown) => { wallet.read(parameters); return {data: undefined, isError: false, isLoading: false} },
  useWriteContract: () => ({writeContract: wallet.write}),
  useSignMessage: () => ({signMessage: wallet.sign}),
  useSendTransaction: () => ({sendTransaction: wallet.send}),
}))
import {App} from './App'
import {Adventure} from './Adventure'
import {CHOG_GENESIS, gameReadAbi} from './contracts'
import {demoEventIndex, events} from './game-data'

// jsdom lacks native dialog methods. Modal isolation and Tab behavior are checked in Chromium.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
})
beforeEach(() => {
  vi.clearAllMocks()
  wallet.address = undefined; wallet.isConnected = false; wallet.connectors = []; wallet.chainId = 143
})
afterEach(cleanup)

function enter() { fireEvent.click(screen.getByRole('button', {name: /enter the wild/i})) }

describe('approved Home and navigation', () => {
  it('enters Adventure without a wallet and restores original Home markup', () => {
    const {container} = render(<App/>)
    const home = container.querySelector('.cinematic-landing')?.outerHTML
    expect(container.querySelector('.adventure-game')).not.toBeInTheDocument()
    enter()
    expect(container.querySelector('.cinematic-landing')).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', {name: /preview choice/i})).toHaveLength(3)
    fireEvent.click(screen.getByRole('button', {name: /back to home/i}))
    expect(container.querySelector('.cinematic-landing')?.outerHTML).toBe(home)
    expect(container.querySelector('.game-shell')).toHaveClass('game-shell-lobby')
  })

  it('preserves Character token selection, canonical ownerOf reads, and Settings navigation', () => {
    render(<App/>); enter()
    fireEvent.click(screen.getByRole('button', {name: /^character$/i}))
    expect(screen.getByText('Trail status')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Token ID'), {target: {value: '1425'}})
    fireEvent.click(screen.getByRole('button', {name: /check token/i}))
    expect(wallet.read).toHaveBeenCalledWith(expect.objectContaining({address: CHOG_GENESIS, functionName: 'ownerOf', args: [1425n]}))
    fireEvent.click(screen.getByRole('button', {name: /^adventure$/i}))
    expect(screen.getByText(/Demo seed: token 1425/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: /^settings$/i}))
    expect(screen.getByRole('heading', {name: /make the trail yours/i})).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: /^home$/i}))
    expect(screen.getByRole('button', {name: /enter the wild/i})).toBeInTheDocument()
  })

  it('preserves Home connect buttons and Adventure connect/disconnect behavior', () => {
    wallet.connectors = [{id: 'injected'}]
    const view = render(<App/>)
    for (const button of screen.getAllByRole('button', {name: /connect wallet/i})) fireEvent.click(button)
    expect(wallet.connect).toHaveBeenCalledTimes(2)
    expect(wallet.connect).toHaveBeenCalledWith({connector: wallet.connectors[0]})
    enter(); fireEvent.click(screen.getByRole('button', {name: /connect wallet/i}))
    expect(wallet.connect).toHaveBeenCalledTimes(3)
    wallet.isConnected = true; wallet.address = '0x1234567890123456789012345678901234567890'
    view.rerender(<App/>); fireEvent.click(screen.getByRole('button', {name: /disconnect/i}))
    expect(wallet.disconnect).toHaveBeenCalledOnce()
  })
})

describe('local Adventure preview', () => {
  it('previews three choices, restores focus, and never changes stats or invokes writes/signing', () => {
    render(<App/>); enter()
    const initialReadCount = wallet.read.mock.calls.length
    const hud = screen.getByLabelText('Simulated character statistics')
    const before = hud.textContent
    const choices = screen.getAllByRole('button', {name: /preview choice/i})
    for (const choice of choices) {
      choice.focus(); fireEvent.click(choice)
      const dialog = screen.getByRole('dialog', {name: choice.querySelector('strong')!.textContent!})
      expect(dialog).toHaveAttribute('aria-describedby', 'preview-disclosure')
      expect(choice).toHaveAttribute('aria-pressed', 'true')
      expect(within(dialog).getByText(/Simulation only/)).toBeInTheDocument()
      const returnButton = within(dialog).getByRole('button', {name: /try another choice/i})
      expect(returnButton).toHaveFocus(); fireEvent.click(returnButton)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(choice).toHaveFocus(); expect(choice).toHaveAttribute('aria-pressed', 'false')
    }
    expect(hud.textContent).toBe(before)
    // Hook invocations on rerender are not RPC requests. Choices never read game outcomes.
    expect(wallet.read.mock.calls.slice(initialReadCount).every(([request]) => request.functionName === 'ownerOf' && !request.query.enabled)).toBe(true)
    expect(wallet.write).not.toHaveBeenCalled(); expect(wallet.sign).not.toHaveBeenCalled(); expect(wallet.send).not.toHaveBeenCalled()
    expect(wallet.connect).not.toHaveBeenCalled()
    expect(gameReadAbi.every((method) => method.stateMutability === 'view')).toBe(true)
    fireEvent.click(screen.getByRole('button', {name: /^character$/i}))
    expect(screen.getByText(/no demo values are substituted/i)).toBeInTheDocument()
    expect(screen.queryByText('184')).not.toBeInTheDocument(); expect(screen.queryByText('62/100')).not.toBeInTheDocument(); expect(screen.queryByText('14/100')).not.toBeInTheDocument()
  })

  it('supports cancellation and restores body scrolling and focus', () => {
    render(<App/>); enter()
    const choice = screen.getAllByRole('button', {name: /preview choice/i})[0]
    choice.focus(); fireEvent.click(choice)
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent(screen.getByRole('dialog'), new Event('cancel', {cancelable: true}))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(choice).toHaveFocus(); expect(document.body.style.overflow).toBe('')
  })

  it('cleans up an open popup when Adventure unmounts', () => {
    document.body.style.overflow = 'auto'
    const view = render(<Adventure now={20000 * 86400000} onHome={vi.fn()}/>)
    fireEvent.click(screen.getAllByRole('button', {name: /preview choice/i})[0])
    expect(document.body.style.overflow).toBe('hidden')
    view.unmount()
    expect(document.body.style.overflow).toBe('auto')
    document.body.style.overflow = ''
  })

  it('starts with no selected preview after returning Home and reentering Adventure', () => {
    render(<App/>); enter()
    fireEvent.click(screen.getAllByRole('button', {name: /preview choice/i})[1])
    fireEvent.click(screen.getByRole('button', {name: /try another choice/i}))
    fireEvent.click(screen.getByRole('button', {name: /back to home/i}))
    enter()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', {name: /preview choice/i}).every((choice) => choice.getAttribute('aria-pressed') === 'false')).toBe(true)
  })

  it('keeps an open result tied to its encounter across a device UTC rollover', () => {
    let day = 20000
    while (demoEventIndex(0n, BigInt(day)) === demoEventIndex(0n, BigInt(day + 1))) day++
    const view = render(<Adventure now={day * 86400000} onHome={vi.fn()}/>)
    fireEvent.click(screen.getAllByRole('button', {name: /preview choice/i})[0])
    const before = screen.getByRole('dialog').textContent
    view.rerender(<Adventure now={(day + 1) * 86400000} onHome={vi.fn()}/>)
    expect(screen.getByRole('dialog').textContent).toBe(before)
    fireEvent.click(screen.getByRole('button', {name: /try another choice/i}))
    expect(screen.getByRole('heading', {level: 1})).toHaveTextContent(events[demoEventIndex(0n, BigInt(day + 1))].name)
  })

  it('remains playable on a wrong network, with writes disabled', () => {
    wallet.chainId = 1; render(<App/>); enter()
    expect(screen.getByText('Wrong network.')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', {name: /preview choice/i})[0])
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /act onchain/i})).toBeDisabled()
    expect(wallet.sign).not.toHaveBeenCalled(); expect(wallet.send).not.toHaveBeenCalled()
  })
})

describe('frozen rulebook coverage', () => {
  const expected = [
    ['Broken Bridge', ['Reinforce', 'Leap the gap', 'Guide others around'], [[12, 5, 0], [22, -2, 5], [9, 9, 1]]],
    ['Hungry Stranger', ['Share rations', 'Question them', 'Drive them away'], [[10, 10, 0], [15, 2, 1], [19, -6, 3]]],
    ['Midnight Storm', ['Hold the shelter', 'Rescue a call', 'Run through it'], [[13, 3, 0], [17, 8, 3], [24, -3, 6]]],
    ['Ancient Gate', ['Solve the runes', 'Open it for all', 'Force the seal'], [[18, 4, 0], [12, 11, 1], [26, -4, 5]]],
    ['Lost Chog', ['Lead them home', 'Mark a safe path', 'Chase the distant cry'], [[11, 12, 1], [16, 5, 0], [23, -1, 4]]],
    ['Shadow Beast', ['Set a ward', 'Distract it away', 'Face it head-on'], [[17, 3, 0], [14, 9, 2], [27, -5, 7]]],
  ] as const

  it.each(expected)('renders %s and all three documented base outcomes', (name, labels, deltas) => {
    const eventIndex = expected.findIndex((event) => event[0] === name)
    let day = 20000
    while (demoEventIndex(0n, BigInt(day)) !== eventIndex) day++
    render(<Adventure now={day * 86400000} onHome={vi.fn()}/>)
    expect(screen.getByRole('heading', {level: 1, name})).toBeInTheDocument()
    for (let index = 0; index < 3; index++) {
      fireEvent.click(screen.getByRole('button', {name: new RegExp(labels[index])}))
      const dialog = screen.getByRole('dialog')
      expect(within(dialog).getByRole('heading', {name: labels[index]})).toBeInTheDocument()
      const values = within(dialog).getAllByRole('definition').map((element) => Number(element.textContent))
      expect(values).toEqual(deltas[index])
      fireEvent.click(within(dialog).getByRole('button', {name: /try another choice/i}))
    }
  })

  it('uses the exact packed keccak rule including large token IDs', () => {
    for (const token of [0n, 1425n, 2n ** 255n]) {
      const day = 20000n
      const hash = keccak256(encodePacked(['address', 'uint256', 'uint64'], [CHOG_GENESIS, token, day]))
      expect(demoEventIndex(token, day)).toBe(Number(BigInt(hash) % 6n))
    }
  })
})

describe('Adventure presentation clarity', () => {
  it('labels the unchanged HUD fixture as demo stats that are not saved', () => {
    render(<Adventure now={20000 * 86400000} onHome={vi.fn()}/>)
    expect(screen.getByText('DEMO STATS — NOT SAVED')).toBeVisible()
    const stats = within(screen.getByLabelText('Simulated character statistics'))
    expect(stats.getByText('184')).toBeVisible()
    expect(stats.getByText('62')).toBeVisible()
    expect(stats.getByText('14')).toBeVisible()
  })

  it.each(['cautious', 'compassionate', 'reckless'] as const)('themes the %s result without changing its choice or trade-off', (category) => {
    let day = 20000
    while (demoEventIndex(0n, BigInt(day)) !== 3) day++
    const event = events[3]
    const index = event.tags.findIndex((tag) => tag === category)
    render(<Adventure now={day * 86400000} onHome={vi.fn()}/>)
    fireEvent.click(screen.getByRole('button', {name: new RegExp(event.choices[index])}))
    const dialog = screen.getByRole('dialog', {name: event.choices[index]})
    expect(dialog).toHaveClass(`adventure-result-${category}`)
    expect(within(dialog).getByRole('heading', {level: 2})).toHaveTextContent(event.choices[index])
    expect(within(dialog).getByText(`${category} choice · LOCAL DEMO`)).toBeVisible()
    expect(within(dialog).getByText(event.consequences[index])).toBeVisible()
    expect(within(dialog).getByText(/before history modifiers and clamping/)).toBeVisible()
    fireEvent.click(within(dialog).getByRole('button', {name: /try another choice/i}))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
