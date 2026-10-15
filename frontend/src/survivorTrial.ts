/** Optional frontend interaction only. Supplies never represent NFT progression. */
export type TrialDifficulty = 'easy' | 'medium' | 'hard'
export type TrialPosition = Readonly<{stage: number; lane: number}>
export type TrialTerrain = 'safe' | 'hazard' | 'shelter' | 'destination'
export type TrialState = Readonly<{
  difficulty: TrialDifficulty
  position: TrialPosition
  trail: readonly TrialPosition[]
  supplies: number | null
  hazards: number
  status: 'playing' | 'complete' | 'failed'
  message: string
}>
export const trialDifficulties = ['easy', 'medium', 'hard'] as const
export const finalStage = (difficulty: TrialDifficulty) => difficulty === 'easy' ? 3 : 5
export function createTrial(difficulty: TrialDifficulty = 'easy'): TrialState {
  if (!trialDifficulties.includes(difficulty)) throw new RangeError('Unknown trial difficulty')
  const position = {stage: 0, lane: 1} as const
  return {difficulty, position, trail: [position], supplies: difficulty === 'hard' ? 7 : null, hazards: 0, status: 'playing', message: 'Your Chog is at camp. Choose a nearby path in the next row.'}
}
export function validPosition(difficulty: TrialDifficulty, position: TrialPosition) {
  return Number.isInteger(position.stage) && Number.isInteger(position.lane) && position.stage >= 0 && position.stage <= finalStage(difficulty) && position.lane >= 0 && position.lane < 3
}
export function terrainAt(difficulty: TrialDifficulty, position: TrialPosition): TrialTerrain {
  if (!validPosition(difficulty, position)) throw new RangeError('Outside the trial map')
  if (position.stage === 0) return 'shelter'
  // One marked danger per crossing. Every position has a reachable safe continuation.
  if (difficulty !== 'easy' && position.lane === (position.stage + 1) % 3) return 'hazard'
  return position.stage === finalStage(difficulty) ? 'destination' : 'safe'
}
export function canReach(state: TrialState, position: TrialPosition) {
  return state.status === 'playing' && validPosition(state.difficulty, position) && position.stage === state.position.stage + 1 && Math.abs(position.lane - state.position.lane) <= 1
}
export function moveTrial(state: TrialState, position: TrialPosition): TrialState {
  if (state.status !== 'playing') return state
  if (!canReach(state, position)) return {...state, message: 'Choose a nearby path in the next row. You cannot jump ahead or cross the whole map.'}
  const hazard = terrainAt(state.difficulty, position) === 'hazard'
  const cost = hazard ? 2 : 1
  const supplies = state.supplies === null ? null : Math.max(0, state.supplies - cost)
  const exhausted = state.supplies !== null && (state.supplies < cost || (hazard && supplies === 0))
  if (exhausted) return {...state, supplies, hazards: state.hazards + Number(hazard), status: 'failed', message: 'Supplies exhausted. Your Chog must regroup. Retry or skip; your NFT progression is unchanged.'}
  if (hazard) return {...state, supplies, hazards: state.hazards + 1, message: `Hazard! Your Chog retreats to the last safe position.${supplies === null ? '' : ' Two trial supplies lost.'} Choose another path.`}
  const complete = position.stage === finalStage(state.difficulty)
  const failed = !complete && supplies === 0
  return {...state, position: {...position}, trail: [...state.trail, {...position}], supplies,
    status: complete ? 'complete' : failed ? 'failed' : 'playing',
    message: complete ? 'Safe passage found! Trial complete. Continue to your original choice preview; the adventure action is not yet confirmed.'
      : failed ? 'Supplies exhausted before reaching safety. Retry or skip; your NFT progression is unchanged.'
      : `Safe crossing ${position.stage} of ${finalStage(state.difficulty)} reached.${supplies === null ? '' : ' One trial supply used.'}`}
}
