import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

vi.mock('wagmi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('wagmi')>()),
  useAccount: () => ({address: undefined, isConnected: false}), useChainId: () => 143,
  useConnect: () => ({connect: vi.fn(), connectors: [], isPending: false}), useDisconnect: () => ({disconnect: vi.fn()}),
  useReadContract: () => ({data: undefined, isError: false, isLoading: false}),
}))
import {App} from './App'

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
})
