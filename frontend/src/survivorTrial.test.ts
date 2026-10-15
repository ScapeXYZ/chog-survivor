import {describe, expect, it} from 'vitest'
import {canReach, createTrial, finalStage, moveTrial, terrainAt, trialDifficulties, validPosition, type TrialState} from './survivorTrial'
const solve = (initial: TrialState) => {
  let state = initial
  for (let stage = 1; stage <= finalStage(state.difficulty); stage++) {
    const lane = [0, 1, 2].find(lane => canReach(state, {stage, lane}) && terrainAt(state.difficulty, {stage, lane}) !== 'hazard')!
    state = moveTrial(state, {stage, lane})
  }
  return state
}
describe('frontend survival route engine', () => {
  it.each(trialDifficulties)('completes %s without randomness or rewards', difficulty => {
    const state = createTrial(difficulty), result = solve(state)
    expect(result.status).toBe('complete'); expect(result.position.stage).toBe(finalStage(difficulty))
    expect(result.trail).toHaveLength(finalStage(difficulty) + 1)
    expect(state.position).toEqual({stage: 0, lane: 1}); expect(state.trail).toHaveLength(1)
    expect(solve(state)).toEqual(result)
    expect(Object.keys(result).sort()).toEqual(['difficulty', 'hazards', 'message', 'position', 'status', 'supplies', 'trail'])
  })
  it('starts at camp with no game progression inputs', () => {
    expect(createTrial().difficulty).toBe('easy')
    expect(createTrial().supplies).toBeNull()
    expect(createTrial('hard').supplies).toBe(7)
  })
  it.each([{stage: -1, lane: 0}, {stage: 1, lane: 3}, {stage: 1.5, lane: 1}, {stage: 9, lane: 1}, {stage: 1, lane: NaN}])('rejects invalid map coordinates $stage/$lane', position => {
    expect(validPosition('easy', position)).toBe(false)
    expect(() => terrainAt('easy', position)).toThrow(RangeError)
    expect(moveTrial(createTrial(), position).position).toEqual({stage: 0, lane: 1})
  })
  it('rejects jumping, backward movement and nonadjacent lanes', () => {
    let state = createTrial('medium')
    state = moveTrial(state, {stage: 1, lane: 0})
    for (const position of [{stage: 2, lane: 2}, {stage: 3, lane: 0}, {stage: 0, lane: 0}]) {
      expect(canReach(state, position)).toBe(false)
      expect(moveTrial(state, position).trail).toEqual(state.trail)
    }
  })
  it('detects hazards and retreats without spending medium supplies', () => {
    const state = createTrial('medium'), next = moveTrial(state, {stage: 1, lane: 2})
    expect(next.position).toEqual(state.position); expect(next.trail).toEqual(state.trail)
    expect(next.hazards).toBe(1); expect(next.supplies).toBeNull(); expect(next.message).toContain('Hazard!')
  })
  it('uses one supply per safe step and two per hazard, permitting exact-zero completion', () => {
    const initial = createTrial('hard'), hit = moveTrial(initial, {stage: 1, lane: 2})
    expect(hit.supplies).toBe(5)
    const result = solve(hit)
    expect(result.supplies).toBe(0); expect(result.status).toBe('complete')
    expect(initial.supplies).toBe(7)
  })
  it('fails safely when supplies are exhausted, then can restart without changing earlier attempts', () => {
    let state = createTrial('hard')
    for (let i = 0; i < 4; i++) state = moveTrial(state, {stage: 1, lane: 2})
    expect(state.status).toBe('failed'); expect(state.supplies).toBe(0); expect(state.hazards).toBe(4)
    expect(moveTrial(state, {stage: 1, lane: 1})).toBe(state)
    expect(createTrial('hard').supplies).toBe(7)
  })
  it('does not accept a partial route or mutate completed routes', () => {
    expect(moveTrial(createTrial(), {stage: 1, lane: 1}).status).toBe('playing')
    const complete = solve(createTrial())
    expect(moveTrial(complete, {stage: 1, lane: 1})).toBe(complete)
  })
  it('has a safe reachable continuation from every playing map location', () => {
    for (const difficulty of trialDifficulties) for (let stage = 0; stage < finalStage(difficulty); stage++) for (let lane = 0; lane < 3; lane++) {
      const state = {...createTrial(difficulty), position: {stage, lane}}
      expect([0, 1, 2].some(next => canReach(state, {stage: stage + 1, lane: next}) && terrainAt(difficulty, {stage: stage + 1, lane: next}) !== 'hazard')).toBe(true)
    }
  })
  it('keeps all Easy routes safe and the start and destination distinct', () => {
    expect(terrainAt('easy', {stage: 0, lane: 1})).toBe('shelter')
    expect(terrainAt('easy', {stage: 3, lane: 1})).toBe('destination')
    for (let stage = 1; stage < 3; stage++) for (let lane = 0; lane < 3; lane++) expect(terrainAt('easy', {stage, lane})).toBe('safe')
  })
  it('rejects unsupported difficulty', () => {
    expect(() => createTrial('royal' as 'easy')).toThrow(RangeError)
  })
  it('copies the caller’s coordinates into the trail', () => {
    const coordinate: {stage: number; lane: number} = {stage: 1, lane: 1}
    const result = moveTrial(createTrial(), coordinate)
    coordinate.lane = 0
    expect(result.position.lane).toBe(1); expect(result.trail[1].lane).toBe(1)
  })
})
