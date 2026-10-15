import {useId, useRef, useState, type KeyboardEvent} from 'react'
import type {PuzzleConfig} from './mini-game-data'
import {canReach, createTrial, finalStage, moveTrial, terrainAt, trialDifficulties, type TrialDifficulty, type TrialState, type TrialTerrain} from './survivorTrial'
import './survivor-trial.css'
import chogAvatar from './assets/survivor-creature-refined-provisional.webp'

export type SurvivorTrialProps = {
  config: PuzzleConfig
  disabled?: boolean
  tokenId?: bigint
  onReadinessChange: (ready: boolean, message: string) => void
}
function TerrainIcon({kind}: {kind: TrialTerrain | 'chog' | 'tree' | 'rune'}) {
  const paths = {
    safe: 'M3 19 10 5l3 6 3-3 5 11Z', hazard: 'm12 3 10 18H2Zm0 5v6m0 3v1',
    shelter: 'M2 19 12 4l10 15ZM12 4v15m-4 0 4-7 4 7', destination: 'M3 22V9l4-6h10l4 6v13M8 22V11a4 4 0 0 1 8 0v11M3 9h4m10 0h4M12 1v3',
    chog: 'M4 20v-8l3-3V4l5 3 5-3v5l3 3v8ZM8 13h1m6 0h1m-7 4h6',
    tree: 'm12 2-8 9h4l-6 7h8v4h4v-4h8l-6-7h4Z', rune: 'm12 2 8 10-8 10-8-10Zm0 0v20M4 12h16',
  }
  return <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d={paths[kind]} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
const titles = {easy: 'Easy · Scout', medium: 'Medium · Survive', hard: 'Hard · Ration'}
const name = (stage: number, lane: number) => `Row ${stage + 1}, path ${lane + 1}`

export function SurvivorTrial({config, disabled = false, tokenId, onReadinessChange}: SurvivorTrialProps) {
  const id = useId()
  const [state, setState] = useState(createTrial)
  const [active, setActive] = useState(1)
  const [motion, setMotion] = useState({sequence: 0, kind: 'ready'})
  const cells = useRef<(HTMLButtonElement | null)[]>([])
  const last = finalStage(state.difficulty)
  const feedback = state.status === 'complete' ? 'Trial complete! Continue to your choice preview; the action is not yet confirmed.'
    : state.status === 'failed' ? state.message
    : motion.kind === 'hazard' ? `Hazard! Back to the last safe position.${state.supplies === null ? ' Try another path.' : ' Two trial supplies lost.'}`
    : state.message
  function update(next: TrialState) {
    setMotion(previous => ({sequence: previous.sequence + 1, kind: next.status === 'complete' ? 'complete' : next.hazards > state.hazards ? 'hazard' : next.position.stage > state.position.stage ? 'crossing' : 'ready'}))
    setState(next)
    onReadinessChange(next.status === 'complete', next.message)
  }
  function reset(difficulty: TrialDifficulty = state.difficulty) {
    setActive(1)
    update(createTrial(difficulty))
  }
  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const row = Math.floor(index / 3), lane = index % 3
    const target: Record<string, number> = {ArrowLeft: row * 3 + Math.max(0, lane - 1), ArrowRight: row * 3 + Math.min(2, lane + 1), ArrowUp: Math.max(0, row - 1) * 3 + lane, ArrowDown: Math.min(last, row + 1) * 3 + lane, Home: row * 3, End: row * 3 + 2}
    if (!Object.prototype.hasOwnProperty.call(target, event.key)) return
    event.preventDefault(); setActive(target[event.key]); cells.current[target[event.key]]?.focus()
  }
  return <div className={`survivor-trial trial-theme-${config.theme}`}>
    <div className="trial-toolbar">
      <div className="trial-survivor"><img src={chogAvatar} alt=""/><div><span>YOUR SURVIVOR</span><strong>{tokenId === undefined ? 'Your Chog' : `CHOG #${tokenId}`}</strong><span>{state.status === 'complete' ? 'Safe passage secured' : 'Find a way through the wilds'}</span></div></div>
      <label className="trial-difficulty" htmlFor={`${id}-difficulty`}>Difficulty
        <select id={`${id}-difficulty`} value={state.difficulty} disabled={disabled} onChange={event => reset(event.target.value as TrialDifficulty)}>
          {trialDifficulties.map(difficulty => <option value={difficulty} key={difficulty}>{titles[difficulty]}</option>)}
        </select>
      </label>
    </div>
    <p className="trial-intro">{config.prompt}</p>
    <p id={`${id}-rules`} className="trial-rules">Choose a glowing path in the next row. {state.difficulty === 'easy' ? 'Every crossing is safe.' : 'Hazards force a retreat.'} {state.difficulty === 'hard' && '7 supplies · step 1 · hazard 2.'} <span className="trial-key-help">Arrows to explore · Enter or Space to move.</span></p>
    <div className="trial-stats" aria-label="Trial progress">
      <span>Crossings <strong>{state.position.stage}/{last}</strong></span>
      <span>Hazards <strong>{state.hazards}</strong></span>
      <span>Trial supplies <strong>{state.supplies === null ? 'Unlimited' : `${state.supplies}/7`}</strong></span>
    </div>
    <div data-feedback={motion.kind} className={`trial-map${state.status === 'complete' ? ' trial-map-complete' : ''}`}>
      <div className="trial-map-caption"><span>DEPARTURE · CAMP</span><TerrainIcon kind="rune"/></div>
      <div className="trial-map-field">
      <svg className="trial-paths" viewBox={`0 0 300 ${(last + 1) * 64}`} preserveAspectRatio="none" aria-hidden="true">
        {Array.from({length: last}, (_, stage) => [0, 1, 2].flatMap(lane => [0, 1, 2].filter(next => Math.abs(lane - next) <= 1).map(next => <path key={`${stage}-${lane}-${next}`} d={`M${50 + lane * 100},${32 + stage * 64} Q${50 + lane * 100},${64 + stage * 64} ${50 + next * 100},${96 + stage * 64}`}/>)))}
        <polyline className="trial-walked-path" points={state.trail.map(step => `${50 + step.lane * 100},${32 + step.stage * 64}`).join(' ')}/>
      </svg>
      <div role="grid" aria-label={`${state.difficulty} survival map`} aria-describedby={`${id}-rules`} aria-rowcount={last + 1} aria-colcount={3} className="trial-grid">
        {Array.from({length: last + 1}, (_, stage) => <div role="row" className="trial-row" key={stage}>
          {Array.from({length: 3}, (_, lane) => {
            const position = {stage, lane}, index = stage * 3 + lane
            const terrain = terrainAt(state.difficulty, position)
            const current = state.position.stage === stage && state.position.lane === lane
            const visited = state.trail.some(step => step.stage === stage && step.lane === lane)
            const reachable = canReach(state, position)
            const label = terrain === 'hazard' ? config.hazard : terrain === 'destination' ? config.destination : terrain === 'shelter' ? 'camp' : 'safe path'
            return <div role="gridcell" key={lane} aria-rowindex={stage + 1} aria-colindex={lane + 1}>
              <button type="button" ref={element => { cells.current[index] = element }} tabIndex={active === index ? 0 : -1} disabled={disabled}
                className={`trial-cell trial-${terrain}${current ? ' trial-current' : ''}${visited ? ' trial-visited' : ''}${reachable ? ' trial-reachable' : ''}`}
                aria-label={`${name(stage, lane)}, ${label}${current ? ', your Chog' : ''}${reachable ? ', reachable' : ''}`} aria-current={current ? 'location' : undefined}
                onFocus={() => setActive(index)} onKeyDown={event => navigate(event, index)} onClick={() => { if (!disabled) update(moveTrial(state, position)) }}>
                {current ? <img key={motion.sequence} className={`trial-chog trial-chog-${motion.kind}`} src={chogAvatar} alt=""/> : <TerrainIcon kind={terrain === 'safe' && config.theme === 'forest' ? 'tree' : terrain === 'safe' && config.theme === 'runes' ? 'rune' : terrain}/> }
                {/* The accessible name carries full terrain details without repeating tile labels. */}
                <span>{current ? 'CHOG' : terrain === 'hazard' ? 'DANGER' : terrain === 'destination' ? 'SAFE' : visited ? 'TRAIL' : terrain === 'shelter' ? 'CAMP' : 'PATH'}</span>
              </button>
            </div>
          })}
        </div>)}
      </div>
      </div>
      <div className="trial-map-caption"><TerrainIcon kind="destination"/><span>DESTINATION · {config.destination}</span></div>
    </div>
    <p className={`trial-feedback trial-feedback-${state.status}`} role="status" aria-live="polite" aria-atomic="true">{feedback}</p>
    <div className="mini-game-actions trial-controls">
      <button type="button" disabled={disabled} onClick={() => reset()}>Reset</button>
      <button type="button" disabled={disabled} onClick={() => reset()}>Retry</button>
    </div>
  </div>
}
