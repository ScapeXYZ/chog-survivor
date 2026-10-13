import {cleanup, fireEvent, render, screen} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

vi.mock('wagmi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('wagmi')>()),
  usePublicClient: () => undefined,
  useAccount: () => ({address: undefined, isConnected: false}), useChainId: () => 143,
  useConnect: () => ({connect: vi.fn(), connectors: [], isPending: false}), useDisconnect: () => ({disconnect: vi.fn()}),
  useReadContract: () => ({data: undefined, isError: false, isLoading: false}),
}))
import {App} from './App'

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
