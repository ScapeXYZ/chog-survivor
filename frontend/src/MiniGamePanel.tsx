import {useEffect, useId, useRef, useState} from 'react'
import type {MiniGameConfig} from './mini-game-data'
import './mini-game.css'
import {SurvivorTrial} from './SurvivorTrial'

export type MiniGamePanelProps = {
  config: MiniGameConfig
  tokenId?: bigint
  onComplete: () => void
  onSkip: () => void
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return reduced
}

// Reset local attempts when the interaction or display identity changes.
// Progression and contract arguments never leave the no-argument callbacks.
export function MiniGamePanel(props: MiniGamePanelProps) {
  return <MiniGameSession key={`${JSON.stringify(props.config)}:${props.tokenId ?? 'unselected'}`} {...props}/>
}

function MiniGameSession({config, tokenId, onComplete, onSkip}: MiniGamePanelProps) {
  const id = useId()
  const reduced = useReducedMotion()
  const [complete, setComplete] = useState(false)
  const [feedback, setFeedback] = useState('Ready when you are. You can also skip this interaction.')
  const [running, setRunning] = useState(false)
  const [position, setPosition] = useState(0)
  const startedAt = useRef(0)
  const continueButton = useRef<HTMLButtonElement>(null)
  const finished = useRef(false)
  const [finishedView, setFinishedView] = useState(false)

  useEffect(() => { if (complete) continueButton.current?.focus() }, [complete])

  useEffect(() => {
    if (!running || reduced || config.kind !== 'timing') return
    const timer = window.setInterval(() => {
      const next = Math.min(1, (Date.now() - startedAt.current) / config.durationMs)
      setPosition(next)
      if (next >= 1) {
        setRunning(false)
        setFeedback('The pulse finished. Try again, or skip; rewards are unchanged.')
      }
    }, 50)
    return () => window.clearInterval(timer)
  }, [running, reduced, config])

  useEffect(() => {
    if (reduced && running) {
      setRunning(false)
      setPosition(0)
      setFeedback('Untimed mode is ready. Continue at your own pace.')
    }
  }, [reduced, running])

  function succeed(message: string) {
    setComplete(true)
    setFeedback(message)
    setRunning(false)
  }

  function finish(skip: boolean) {
    if (finished.current || (!skip && !complete)) return
    finished.current = true
    setFinishedView(true)
    setRunning(false)
    setFeedback(skip ? 'Interaction skipped. Rewards are unchanged.' : 'Interaction complete. Rewards are unchanged.')
    if (skip) onSkip()
    else onComplete()
  }

  function timingAction() {
    if (config.kind !== 'timing' || complete || finished.current) return
    if (!running) {
      startedAt.current = Date.now()
      setPosition(0)
      setRunning(true)
      setFeedback('Pulse started. Stop in the broad center zone, from 30% to 70%.')
    } else {
      const stopped = Math.min(1, (Date.now() - startedAt.current) / config.durationMs)
      setPosition(stopped)
      setRunning(false)
      if (stopped >= .3 && stopped <= .7) succeed('Ready! You stopped in the center zone.')
      else setFeedback('Outside the center zone. Try again, or skip; rewards are unchanged.')
    }
  }

  const disabled = complete || finishedView
  return <section className={`mini-game-panel${config.kind === 'puzzle' ? ' mini-game-trial' : ''}`} aria-labelledby={`${id}-title`} aria-describedby={`${id}-notice`}>
    <p className="adventure-eyebrow">OPTIONAL INTERACTION</p>
    <h3 id={`${id}-title`}>{config.kind === 'puzzle' ? 'Survivor’s Trial' : config.kind === 'timing' ? 'Timing' : 'Story'}</h3>
    {config.kind === 'puzzle' && <div className="mini-game-actions trial-skip"><button type="button" disabled={finishedView} aria-label="Skip interaction" onClick={() => finish(true)}>Skip</button></div>}
    <p id={`${id}-notice`} className="mini-game-notice">Interactions do not affect on-chain rewards, your selected choice, or daily eligibility.</p>
    <p className="mini-game-progress">Progress: {finishedView ? 'Finished' : complete ? '1 of 1 · Ready to continue' : '0 of 1'}</p>

    {config.kind === 'puzzle' && <SurvivorTrial config={config} tokenId={tokenId} disabled={finishedView} onReadinessChange={(ready, message) => {
      setComplete(ready)
      setFeedback(message)
    }}/>}

    {config.kind === 'timing' && <>
      {reduced ? <>
        <p>Reduced motion: untimed readiness. Take a breath, then mark yourself ready. No moving indicator or time limit.</p>
        <button type="button" disabled={disabled} onClick={() => succeed('Ready! Untimed interaction complete.')}>I am ready</button>
      </> : <>
        <p>{config.cue}</p>
        <p>Stop in the broad center zone (30%–70%). Each pulse lasts {config.durationMs / 1000} seconds. Retries are unlimited.</p>
        <div className="mini-game-readiness" role="meter" aria-label="Readiness indicator" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(position * 100)} aria-valuetext={`${Math.round(position * 100)} percent; target 30 to 70 percent`}>
          <span className="mini-game-target" aria-hidden="true"/>
          <span className="mini-game-marker" style={{left: `${position * 100}%`}} aria-hidden="true"/>
        </div>
        <button type="button" disabled={disabled} onClick={timingAction}>{running ? 'Stop' : 'Start'}</button>
      </>}
    </>}

    {config.kind === 'story' && <>
      <p>{config.prompt}</p>
      <p>Either response completes this interaction for the same selected choice.</p>
      <div className="mini-game-options mini-game-story" role="group" aria-label="Choose a response">
        {config.responses.map((response, index) => <button type="button" key={index} disabled={disabled} onClick={() => succeed('Response chosen. Your selected choice is unchanged.')}>{response}</button>)}
      </div>
    </>}

    {config.kind !== 'puzzle' && <p className="mini-game-feedback" role="status" aria-live="polite" aria-atomic="true">{feedback}</p>}
    <div className="mini-game-actions">
      {complete && <button ref={continueButton} type="button" disabled={finishedView} onClick={() => finish(false)}>Continue</button>}
      {config.kind !== 'puzzle' && <button type="button" disabled={finishedView} onClick={() => finish(true)}>Skip interaction</button>}
    </div>
  </section>
}
