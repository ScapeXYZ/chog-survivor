import {cleanup, render, screen} from '@testing-library/react'
import {afterEach, beforeEach, expect, it, vi} from 'vitest'
const mock=vi.hoisted(()=>({connected:true,onMonad:true,verified:true,controls:true,bound:true}))
vi.mock('./contracts',async original=>({...await original<typeof import('./contracts')>(),mainnetTransactionsEnabled:true}))
vi.mock('wagmi',async original=>({...await original<typeof import('wagmi')>(),usePublicClient:()=>undefined,useWalletClient:()=>({data:undefined})}))
vi.mock('./useSurvivorProgress',()=>({useSurvivorProgress:()=>({bound:mock.bound,state:{xp:0},identity:{...mock,address:'0x1111111111111111111111111111111111111111',contextKey:'fixture:143:1425',scopeKey:'fixture',owner:{data:'0x1111111111111111111111111111111111111111'},ownershipMessage:'Fixture ownership context'}})}))
// Deliberately stale availability: UI must gate even if a snapshot survives a context change.
vi.mock('./useAdventureAvailability',()=>({useAdventureAvailability:()=>({snapshot:{eventId:1,preview:{canAct:true}},loading:false,error:undefined,refresh:vi.fn()})}))
vi.mock('./useNftMetadata',()=>({useNftMetadata:()=>({})}))
import {MainnetGameplayPanel} from './MainnetGameplayPanel'
beforeEach(()=>{Object.assign(mock,{connected:true,onMonad:true,verified:true,controls:true,bound:true});localStorage.clear()})
afterEach(cleanup)
it('shows the three real encounter decisions only for a verified current owner',()=>{render(<MainnetGameplayPanel selectedToken={1425n}/>);expect(screen.getAllByRole('button',{name:/Review real contract action/})).toHaveLength(3)})
it.each(['connected','onMonad','verified','controls','bound'] as const)('hides stale gameplay choices when %s is false',field=>{mock[field]=false;render(<MainnetGameplayPanel selectedToken={1425n}/>);expect(screen.queryAllByRole('button',{name:/Review real contract action/})).toHaveLength(0);expect(screen.queryByRole('button',{name:'Request wallet confirmation'})).not.toBeInTheDocument()})
it('removes cached choices immediately when ownership changes',()=>{const v=render(<MainnetGameplayPanel selectedToken={1425n}/>);expect(screen.getAllByRole('button',{name:/Review real contract action/})).toHaveLength(3);mock.controls=false;v.rerender(<MainnetGameplayPanel selectedToken={1425n}/>);expect(screen.queryAllByRole('button',{name:/Review real contract action/})).toHaveLength(0)})
