import {expect,it} from 'vitest'
import {guestStories,guestStory} from './guest-story'
import {guestStep,initialGuest} from './GuestChog'

it('has a distinct one-sentence scene for all 21 guest choices',()=>{
  expect(guestStories).toHaveLength(7)
  expect(new Set(guestStories.flat()).size).toBe(21)
  for(const scene of guestStories) for(const text of scene) {
    expect(text.match(/[.!?]/g)).toHaveLength(1)
    expect(text.length).toBeLessThan(180)
  }
})

it.each(guestStories.flatMap((scene,i)=>scene.map((_,j)=>[i,j])))('resolves the correct story and actual deltas for scene %i choice %i',(scene,choice)=>{
  const before={...initialGuest,scene,trust:50,scars:10}
  const after=guestStep(before,{type:'choose',choice})
  const text=guestStory(scene,choice,after.effects!)
  expect(text.startsWith(guestStories[scene][choice])).toBe(true)
  expect(text).toContain(`You gain ${after.xp-before.xp} XP`)
  expect(text.match(/[.!?]/g)).toHaveLength(2)
})

it('describes clamped healing and Trust rather than requested rewards',()=>{
  let after=guestStep({...initialGuest,scene:6,trust:99,scars:1},{type:'choose',choice:0})
  expect(guestStory(6,0,after.effects!)).toContain('Trust rises by 1, and 1 Scar heals')
  after=guestStep({...initialGuest,scene:6,trust:100,scars:0},{type:'choose',choice:0})
  expect(guestStory(6,0,after.effects!)).toContain('Trust holds steady, and your Scars are unchanged')
})

it('refuses missing or unresolved story inputs',()=>{
  expect(()=>guestStory(7,0,[1,1,1])).toThrow()
  expect(()=>guestStory(0,3,[1,1,1])).toThrow()
  expect(()=>guestStory(0,0,[NaN,0,0])).toThrow()
})
