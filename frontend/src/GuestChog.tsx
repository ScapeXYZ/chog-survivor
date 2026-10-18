import {useReducer} from 'react'
import {events} from './game-data'
import {guestStory} from './guest-story'
import chog from './assets/survivor-creature-refined-provisional.webp'
import forest from './assets/ruined-wild-environment-provisional.webp'
import './guest-chog.css'
export type GuestState = {scene: number; xp: number; trust: number; scars: number; choice?: number; surprise?: boolean; effects?: number[]}
export const rareGuestEvent = {name: 'The Moonlit Seed', narrative: 'A silver seed pulses beneath a fallen tree. A frightened forest sprite guards it. This rare detour exists only in Guest Mode.', choices: ['Shelter the sprite', 'Study the seed', 'Seize its light'], tags: ['compassionate', 'cautious', 'reckless'], baseDeltas: [[8, 12, -2], [16, 3, 0], [25, -8, 6]], consequences: ['The sprite can mend up to two guest Scars and grants Trust; you leave the seed behind.', 'You learn its patterns without taking its power: steady guest XP, modest Trust, no new Scars.', 'A burst of guest XP comes at the cost of Trust and six Scars. The sprite vanishes.']}
export const initialGuest: GuestState = {scene: 0, xp: 0, trust: 0, scars: 0}
export function guestStep(state: GuestState, action: {type: 'choose'; choice: number; surpriseRoll?: number} | {type: 'bonus'} | {type: 'next'} | {type: 'reset'}): GuestState {
  if(action.type==='reset')return {...initialGuest}
  if(action.type==='bonus')return state.scene===5&&state.choice!==undefined&&state.surprise?{...state,scene:6,choice:undefined}:state
  if(action.type==='next')return state.choice===undefined||state.scene>=events.length-1?state:{...state,scene:state.scene+1,choice:undefined}
  if(state.choice!==undefined||!Number.isInteger(action.choice)||action.choice<0||action.choice>2)return state
  const [xp,trust,scars]=(state.scene===6?rareGuestEvent:events[state.scene]).baseDeltas[action.choice]
  const trustAfter=Math.max(0,Math.min(100,state.trust+trust)),scarsAfter=Math.max(0,Math.min(100,state.scars+scars))
  return {...state,xp:state.xp+xp,trust:trustAfter,scars:scarsAfter,effects:[xp,trustAfter-state.trust,scarsAfter-state.scars],choice:action.choice,surprise:state.scene===5?typeof action.surpriseRoll==='number'&&action.surpriseRoll>=0&&action.surpriseRoll<0.1:state.surprise}
}
// Deliberately no wallet, RPC, contract, NFT selection, pending journal or persistent storage dependencies.
export function GuestChog({onNft}: {onNft:()=>void}) {
  const [state,dispatch]=useReducer(guestStep,initialGuest)
  const event=state.scene===6?rareGuestEvent:events[state.scene],done=state.choice!==undefined
  return <main className="guest-game" style={{backgroundImage:`linear-gradient(#081819d9,#081819f2),url(${forest})`}}>
    <header><a href="#" onClick={event=>{event.preventDefault();onNft()}}>CHOG SURVIVOR</a><strong>Guest Mode — off-chain preview</strong><button onClick={onNft}>Play with Your NFT</button></header>
    <section className="guest-intro"><div><p className="guest-eyebrow">NO WALLET · NO NFT · NO GAS</p><h1>Your first night in the wild.</h1><p>Meet your Guest Chog. Six encounters. Every choice leaves a mark.</p></div><img src={chog} alt="Guest Chog character illustration — not an owned NFT"/></section>
    <section className="guest-stats" aria-label="Guest progression — off-chain only">{(['xp','trust','scars'] as const).map(key=><div key={key}><span>{key.toUpperCase()}</span><strong>{state[key]}</strong></div>)}</section>
    <section className="guest-encounter" aria-labelledby="guest-event"><p className="guest-eyebrow">{state.scene===6?'RARE GUEST DETOUR — OFF-CHAIN ONLY':`GUEST JOURNEY · ${state.scene+1} / 6`}</p><h2 id="guest-event">{event.name}</h2><p>{event.narrative}</p>
      <div className="guest-choices">{event.choices.map((choice,index)=><button key={choice} disabled={done} onClick={()=>dispatch({type:'choose',choice:index,surpriseRoll:state.scene===5?Math.random():undefined})}><small>{event.tags[index]}</small><strong>{choice}</strong><span>{event.consequences[index]}</span></button>)}</div>
      {done&&<div className="guest-outcome" role="status"><h3>Your guest choice: {event.choices[state.choice!]}</h3><p className="guest-story">{guestStory(state.scene,state.choice!,state.effects!)}</p><p>Guest effects: {state.effects!.map((value,index)=>`${value>=0?'+':''}${value} ${['XP','Trust','Scars'][index]}`).join(' · ')}. Trust and Scars stay between 0 and 100.</p>{state.scene<5?<button onClick={()=>dispatch({type:'next'})}>Continue the guest journey</button>:<><h3>Your Chog survived the journey.</h3><p>The forest has more stories. Try a different path next time, or bring your NFT for one real decision each UTC day. Guest runs do not earn mainnet streaks or achievements.</p>{state.scene===5&&state.surprise&&<><p>A silver glimmer appears beyond camp… A rare guest-only encounter awaits.</p><button onClick={()=>dispatch({type:'bonus'})}>Follow the silver glimmer</button></>}<button onClick={()=>dispatch({type:'reset'})}>Play again as Guest</button><button onClick={onNft}>Play with Your NFT</button></>}</div>}
    </section>
    <footer><p>Guest progress belongs only to this off-chain preview. It is never saved to a wallet, NFT, transaction history or Monad.</p><p>The Moonlit Seed has a 1-in-10 chance to appear after a completed guest journey. Its bonus choices and effects are off-chain only, never mainnet rewards.</p><p>Guest choices use the six-encounter rulebook’s base effects in an accelerated journey. Real NFT play uses contract modifiers and one action per UTC day.</p><button onClick={()=>dispatch({type:'reset'})}>Restart guest preview</button><a href="#" onClick={e=>{e.preventDefault();onNft()}}>Explore real NFT gameplay →</a></footer>
  </main>
}
