import {useReducer} from 'react'
import {events} from './game-data'
import chog from './assets/survivor-creature-refined-provisional.webp'
import forest from './assets/ruined-wild-environment-provisional.webp'
import './guest-chog.css'
export type GuestState = {scene: number; xp: number; trust: number; scars: number; choice?: number}
export const initialGuest: GuestState = {scene: 0, xp: 0, trust: 0, scars: 0}
export function guestStep(state: GuestState, action: {type: 'choose'; choice: number} | {type: 'next'} | {type: 'reset'}): GuestState {
  if(action.type==='reset')return {...initialGuest}
  if(action.type==='next')return state.choice===undefined||state.scene===events.length-1?state:{...state,scene:state.scene+1,choice:undefined}
  if(state.choice!==undefined||!Number.isInteger(action.choice)||action.choice<0||action.choice>2)return state
  const [xp,trust,scars]=events[state.scene].baseDeltas[action.choice]
  return {...state,xp:state.xp+xp,trust:Math.max(0,Math.min(100,state.trust+trust)),scars:Math.max(0,Math.min(100,state.scars+scars)),choice:action.choice}
}
// Deliberately no wallet, RPC, contract, NFT selection, pending journal or persistent storage dependencies.
export function GuestChog({onNft}: {onNft:()=>void}) {
  const [state,dispatch]=useReducer(guestStep,initialGuest)
  const event=events[state.scene],done=state.choice!==undefined
  return <main className="guest-game" style={{backgroundImage:`linear-gradient(#081819d9,#081819f2),url(${forest})`}}>
    <header><a href="#" onClick={event=>{event.preventDefault();onNft()}}>CHOG SURVIVOR</a><strong>Guest Mode — off-chain preview</strong><button onClick={onNft}>Play with Your NFT</button></header>
    <section className="guest-intro"><div><p className="guest-eyebrow">NO WALLET · NO NFT · NO GAS</p><h1>Your first night in the wild.</h1><p>Meet your Guest Chog. Six encounters. Every choice leaves a mark.</p></div><img src={chog} alt="Guest Chog character illustration — not an owned NFT"/></section>
    <section className="guest-stats" aria-label="Guest progression — off-chain only">{(['xp','trust','scars'] as const).map(key=><div key={key}><span>{key.toUpperCase()}</span><strong>{state[key]}</strong></div>)}</section>
    <section className="guest-encounter" aria-labelledby="guest-event"><p className="guest-eyebrow">GUEST JOURNEY · {state.scene+1} / 6</p><h2 id="guest-event">{event.name}</h2><p>{event.narrative}</p>
      <div className="guest-choices">{event.choices.map((choice,index)=><button key={choice} disabled={done} onClick={()=>dispatch({type:'choose',choice:index})}><small>{event.tags[index]}</small><strong>{choice}</strong><span>{event.consequences[index]}</span></button>)}</div>
      {done&&<div className="guest-outcome" role="status"><h3>Your guest choice: {event.choices[state.choice!]}</h3><p>{event.consequences[state.choice!]}</p><p>Guest effects: {event.baseDeltas[state.choice!].map((value,index)=>`${value>=0?'+':''}${value} ${['XP','Trust','Scars'][index]}`).join(' · ')}. Trust and Scars stay between 0 and 100.</p>{state.scene<5?<button onClick={()=>dispatch({type:'next'})}>Continue the guest journey</button>:<><h3>Your Chog survived the journey.</h3><button onClick={()=>dispatch({type:'reset'})}>Play again as Guest</button><button onClick={onNft}>Play with Your NFT</button></>}</div>}
    </section>
    <footer><p>Guest progress belongs only to this off-chain preview. It is never saved to a wallet, NFT, transaction history or Monad.</p><p>Guest choices use the six-encounter rulebook’s base effects in an accelerated journey. Real NFT play uses contract modifiers and one action per UTC day.</p><button onClick={()=>dispatch({type:'reset'})}>Restart guest preview</button><a href="#" onClick={e=>{e.preventDefault();onNft()}}>Explore real NFT gameplay →</a></footer>
  </main>
}
