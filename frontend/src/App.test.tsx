import {cleanup, fireEvent, render, screen} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

const wallet = vi.hoisted(() => ({connect: vi.fn(), connectors: [] as {id: string; name?: string}[], chainId: 143, connected: false}))

vi.mock('wagmi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('wagmi')>()),
  usePublicClient: () => undefined,
  useAccount: () => ({address: wallet.connected ? '0x0000000000000000000000000000000000000001' : undefined, isConnected: wallet.connected, chainId: wallet.chainId}), useChainId: () => 143,
  useConnect: () => ({connect: wallet.connect, connectors: wallet.connectors, isPending: false}), useDisconnect: () => ({disconnect: vi.fn()}),
  useReadContract: () => ({data: undefined, isError: false, isLoading: false}),
}))
import {App} from './App'

beforeEach(() => { wallet.connect.mockClear(); wallet.connectors = []; wallet.chainId = 143; wallet.connected = false })
afterEach(cleanup)

describe('game lobby navigation', () => {
  it('enters adventure and keeps onchain actions disabled', () => {
    const {container} = render(<App />)
    expect(container.querySelector('.game-shell')).toHaveClass('game-shell-lobby')
    expect(screen.getAllByRole('button', {name: /connect wallet/i})).toHaveLength(2)
    expect(screen.getAllByRole('button', {name: /connect wallet/i}).every((button) => button.hasAttribute('disabled'))).toBe(true)
    fireEvent.click(screen.getByRole('button', {name: /enter the wild/i}))
    expect(screen.getByText(/daily encounter/i)).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /act onchain/i})).toBeDisabled()
  })
  it('never connects on load, navigation, or walletless adventure with a wallet available', () => {
    wallet.connectors = [{id: 'injected'}]
    render(<App />)
    expect(screen.getByText(/Public demo is a simulation\. Wallet connection is optional/)).toBeVisible()
    expect(screen.getByText(/Production game transactions are disabled/)).toBeVisible()
    expect(wallet.connect).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', {name: /enter the wild/i}))
    expect(screen.getByText('DEMO STATS — NOT SAVED')).toBeVisible()
    fireEvent.click(screen.getByRole('button', {name: /^character$/i}))
    fireEvent.click(screen.getByRole('button', {name: /^settings$/i}))
    expect(wallet.connect).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', {name: 'Game contract information'})).toBeVisible()
    expect(screen.getByRole('link', {name: /MonadScan deployment record/})).toHaveAttribute('href', 'https://monadscan.com/address/0x4735A5263bAC1bDFB4715A5bed143cCD4d62d390#code')
    expect(screen.getByText(/Source verified on MonadScan \(Exact Match\); deployment remains unaudited/)).toBeVisible()
  })
  it('connects only from an explicit wallet button without requesting a chain switch', () => {
    const connector = {id: 'injected'}
    wallet.connectors = [connector]
    render(<App />)
    const buttons = screen.getAllByRole('button', {name: /connect wallet/i})
    for (const button of buttons) {
      wallet.connect.mockClear()
      fireEvent.click(button)
      expect(wallet.connect).not.toHaveBeenCalled()
      fireEvent.click(screen.getByRole('button', {name: 'injected'}))
      expect(wallet.connect).toHaveBeenCalledExactlyOnceWith({connector})
    }
  })
  it('selects the intended wallet and cancels without connection', () => {
    const metamask = {id: 'io.metamask', name: 'MetaMask'}
    const rabby = {id: 'io.rabby', name: 'Rabby'}
    wallet.connectors = [metamask, rabby]
    render(<App />)
    fireEvent.click(screen.getAllByRole('button', {name: /connect wallet/i})[0])
    expect(screen.getByRole('dialog')).toBeVisible()
    expect(wallet.connect).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', {name: 'Cancel'}))
    expect(wallet.connect).not.toHaveBeenCalled()
    fireEvent.click(screen.getAllByRole('button', {name: /connect wallet/i})[1])
    fireEvent.click(screen.getByRole('button', {name: 'Rabby'}))
    expect(wallet.connect).toHaveBeenCalledExactlyOnceWith({connector: rabby})
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  it('keeps keyboard focus in the wallet dialog and restores the trigger on Escape', () => {
    wallet.connectors = [{id: 'io.metamask', name: 'MetaMask'}, {id: 'io.rabby', name: 'Rabby'}]
    render(<App />)
    const trigger = screen.getAllByRole('button', {name: /connect wallet/i})[0]
    trigger.focus(); fireEvent.click(trigger)
    const close = screen.getByRole('button', {name: 'Close wallet selection'})
    expect(close).toHaveFocus()
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.keyDown(close, {key: 'Tab', shiftKey: true})
    expect(screen.getByRole('button', {name: 'Cancel'})).toHaveFocus()
    fireEvent.keyDown(document.activeElement!, {key: 'Tab'})
    expect(close).toHaveFocus()
    fireEvent.keyDown(close, {key: 'Escape'})
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
    expect(document.body.style.overflow).not.toBe('hidden')
    expect(wallet.connect).not.toHaveBeenCalled()
  })
  it('always offers an explicit choice even with only one discovered wallet', () => {
    wallet.connectors = [{id: 'io.metamask', name: 'MetaMask'}]
    render(<App />)
    fireEvent.click(screen.getAllByRole('button', {name: /connect wallet/i})[0])
    expect(screen.getByRole('dialog')).toHaveAccessibleDescription(/Simulation needs no wallet/)
    expect(wallet.connect).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', {name: 'Close wallet selection'}))
    expect(wallet.connect).not.toHaveBeenCalled()
  })
  it('shows the actual unsupported wallet chain instead of the configured RPC chain', () => {
    wallet.connected = true; wallet.chainId = 1
    render(<App />)
    fireEvent.click(screen.getByRole('button', {name: /^settings$/i}))
    expect(screen.getByText('Wrong network.')).toBeVisible()
    expect(screen.getByText('Wallet chain 1 · wallet mismatch')).toBeVisible()
    expect(screen.getByText('Production transactions disabled')).toBeVisible()
    expect(wallet.connect).not.toHaveBeenCalled()
  })
  it('persists functional channel, mute, and volume settings across remounts', () => {
    localStorage.clear()
    const view = render(<App />)
    fireEvent.click(screen.getByRole('button', {name: /^settings$/i}))
    const switches = screen.getAllByRole('switch')
    fireEvent.click(switches[0]); fireEvent.click(switches[2])
    fireEvent.change(screen.getByLabelText('Master volume'), {target: {value: '.35'}})
    expect(screen.getByText('35%')).toBeInTheDocument()
    view.unmount(); render(<App />); fireEvent.click(screen.getByRole('button', {name: /^settings$/i}))
    const restored = screen.getAllByRole('switch')
    expect(restored[0]).toHaveAttribute('aria-checked', 'false')
    expect(restored[2]).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByLabelText('Master volume')).toHaveValue('0.35')
  })
})
