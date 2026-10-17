import {cleanup, fireEvent, render, screen} from '@testing-library/react'
import {afterEach, expect, it, vi} from 'vitest'
vi.mock('wagmi',async original=>({...await original<typeof import('wagmi')>(),useAccount:()=>({isConnected:false})}))
vi.mock('./YourSurvivors',()=>({YourSurvivors:({automatic}:{automatic:boolean})=><p>{automatic?'Automatic discovery ready':'Manual discovery'}</p>}))
import {SurvivorSelection} from './SurvivorSelection'
afterEach(cleanup)
it('offers an explicit connection and automatic discovery without invented survivor data',()=>{const connect=vi.fn();render(<SurvivorSelection onSelectToken={vi.fn()} onConnect={connect}/>);fireEvent.click(screen.getByRole('button',{name:'Connect wallet to find your Chogs'}));expect(connect).toHaveBeenCalledOnce();expect(screen.getByText('Automatic discovery ready')).toBeInTheDocument();expect(screen.queryByText(/XP|Trust|Scars|owned Chogs/)).not.toBeInTheDocument()})
it('keeps manual fallback usable while discovery is unavailable without asserting ownership',()=>{const select=vi.fn();render(<SurvivorSelection onSelectToken={select} onConnect={vi.fn()}/>);fireEvent.click(screen.getByText('Enter a Chog Genesis token ID'));fireEvent.change(screen.getByLabelText('Survivor token ID'),{target:{value:'1425'}});fireEvent.click(screen.getByRole('button',{name:'Select survivor'}));expect(select).toHaveBeenCalledWith(1425n);expect(screen.queryByText('You control this survivor')).not.toBeInTheDocument()})
it('rejects invalid manual token input',()=>{render(<SurvivorSelection onSelectToken={vi.fn()} onConnect={vi.fn()}/>);fireEvent.change(screen.getByLabelText('Survivor token ID'),{target:{value:'-1'}});expect(screen.getByRole('button',{name:'Select survivor'})).toBeDisabled()})
