// Localhost-only harness dependencies. No provider, RPC transport or signer.
import {useSyncExternalStore} from 'react'
import {fixture, account, other} from './gameplayFixture'
const t = fixture()
let revision = 0, verified = false, scenario = 'success'
const changed = () => {revision++;dispatchEvent(new Event('fixture-change'))}
addEventListener('focus', changed)
const saved = localStorage.getItem('chog:mainnet-action:v1')
if (saved) t.setData(JSON.parse(saved).data)
function useFixture() {useSyncExternalStore(listener => {addEventListener('fixture-change', listener);addEventListener('focus', listener);return () => {removeEventListener('fixture-change',listener);removeEventListener('focus',listener)}}, () => revision)}
const originalWait = t.client.waitForTransactionReceipt.bind(t.client)
t.client.waitForTransactionReceipt = (async request => {
  if (scenario === 'pending') await new Promise(resolve => setTimeout(resolve, 1500))
  const receipt = await originalWait(request)
  if (receipt.status === 'success' && scenario !== 'cancelled') {verified = true;t.f.canAct = false}
  return receipt
}) as typeof t.client.waitForTransactionReceipt
// Actual controller always gets fake public client/wallet. Browser routing additionally blocks all external requests.
export function usePublicClient() {return t.client}
export function useWalletClient() {return {data: t.wallet}}
export function useNftMetadata() {return {tokenUri: {}, metadata: undefined, error: 'Fixture metadata withheld'}}
export function useAdventureAvailability() {useFixture();return {snapshot: {day:100n,eventId:1,preview:t.preview()},loading:false,error:undefined,refresh:async()=>true}}
export function useSurvivorProgress() {
  useFixture()
  const owns = t.f.owner === account, onMonad = t.f.walletChain === 143
  const identity = {address:account,verified:onMonad,connected:true,onMonad,enabled:onMonad,checkingOwner:false,controls:owns&&onMonad,contextKey:scenario+':1425',scopeKey:scenario,ownershipMessage:!onMonad?'Wrong network. Select Monad chain 143.':owns?'Isolated fixture owner verified':'Another wallet controls this survivor.',owner:{data:t.f.owner,refetch:async()=>({data:t.f.owner})}}
  return {identity,proof:{verified:true,blockNumber:10n},bound:true,character:{isError:false},state:verified?t.state():{...t.state(),xp:0,trust:0,scars:0,streak:0,achievementMask:0n,hasActed:false},titleName:'Wandering Chog'}
}
Object.assign(window, {__gameplayFixture: {sends:()=>t.f.sends,configure:(name:string)=>{
  scenario=name;verified=false;t.f.owner=name==='non-owner'?other:account;t.f.walletChain=name==='wrong-network'?1:143;t.f.mode=name==='pending'?'success':name;t.f.reject=name==='rejected';t.f.unknownWalletError=false;t.f.gasError=name==='gas-failure';t.f.canAct=true;changed()
}}})
