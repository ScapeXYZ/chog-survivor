import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {afterEach, beforeEach, expect, it, vi} from 'vitest'
const mock = vi.hoisted(() => ({request: vi.fn(), connector: true}))
vi.mock('wagmi', () => ({useAccount: () => ({connector: mock.connector ? {getProvider: async () => ({request: mock.request})} : undefined})}))
import {SwitchMonadNetwork} from './SwitchMonadNetwork'
beforeEach(() => {mock.connector=true;mock.request.mockReset();mock.request.mockResolvedValue(null)})
afterEach(cleanup)
it('switches only on explicit interaction to chain 143, without any transaction method',async()=>{render(<SwitchMonadNetwork/>);expect(mock.request).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button'));await waitFor(()=>expect(mock.request).toHaveBeenCalledExactlyOnceWith({method:'wallet_switchEthereumChain',params:[{chainId:'0x8f'}]}))})
it('handles rejected or unsupported switching without assuming the chain changed',async()=>{mock.request.mockRejectedValue(Error('Unsupported'));render(<SwitchMonadNetwork/>);fireEvent.click(screen.getByRole('button'));await screen.findByText(/Network switch rejected or unsupported/);expect(screen.getByRole('button')).toBeEnabled()})
it('does not request any provider when disconnected',()=>{mock.connector=false;render(<SwitchMonadNetwork/>);expect(screen.getByRole('button')).toBeDisabled();expect(mock.request).not.toHaveBeenCalled()})
