import {useEffect, useMemo, useRef, useState} from 'react'
import {achievements, demoCharacter, demoEventIndex, events, titles} from './game-data'
import {signed} from './utils'
import wildEnvironment from './assets/ruined-wild-environment-provisional.webp'
import fogOverlay from './assets/moonlit-fog-overlay-provisional.webp'
import './adventure.css'

type Preview = {eventIndex: number; choiceIndex: number}

function ChoiceResult({preview, onReturn}: {preview: Preview; onReturn: () => void}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const returnRef = useRef<HTMLButtonElement>(null)
  const event = events[preview.eventIndex]
  const deltas = event.baseDeltas[preview.choiceIndex]

  useEffect(() => {
    const dialog = dialogRef.current
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    dialog?.showModal()
    returnRef.current?.focus()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog?.close()
      document.body.style.overflow = previousOverflow
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [])

  return <dialog ref={dialogRef} className="adventure-result" aria-labelledby="preview-title" aria-describedby="preview-disclosure" onCancel={(event) => { event.preventDefault(); onReturn() }}>
    <div className="adventure-result-stamp" aria-hidden="true">CS</div>
    <p className="adventure-eyebrow">LOCAL DEMO · OUTCOME {preview.eventIndex * 3 + preview.choiceIndex + 1}</p>
    <h2 id="preview-title">Your choice leaves a mark.</h2>
    <p className="adventure-result-encounter">{event.name}</p>
    <h3>{event.choices[preview.choiceIndex]}</h3>
    <p className="adventure-result-story">{event.consequences[preview.choiceIndex]}</p>
    <p className="adventure-result-label">Rulebook base deltas · preview only</p>
    <dl className="adventure-result-rewards">
      {(['XP', 'Trust', 'Scars'] as const).map((label, index) => <div key={label} className={`adventure-reward-${label.toLowerCase()}`}><dt>{label}</dt><dd>{signed(deltas[index])}</dd></div>)}
    </dl>
    <p id="preview-disclosure" className="adventure-result-disclosure">Simulation only. These are documented base values, before history modifiers and clamping. No progress is saved, no wallet signature is requested, and nothing is sent onchain.</p>
    <button ref={returnRef} className="adventure-return-choice" onClick={onReturn}>TRY ANOTHER CHOICE <span aria-hidden="true">↻</span></button>
    <p className="adventure-result-hint">Escape also returns to Adventure.</p>
  </dialog>
}

export function Adventure({now, selectedToken, onHome}: {now: number; selectedToken?: bigint; onHome: () => void}) {
  const day = Math.floor(now / 86400000)
  const eventIndex = useMemo(() => demoEventIndex(selectedToken ?? 0n, BigInt(day)), [selectedToken, day])
  const event = events[eventIndex]
  const [preview, setPreview] = useState<Preview>()
  // Snapshot the event with the choice so a UTC rollover cannot change an open result.
  const selectedChoice = preview?.eventIndex === eventIndex ? preview.choiceIndex : undefined

  return <section className="adventure-game" aria-labelledby="adventure-title">
    <header className="adventure-hud">
      <div className="adventure-brand"><span className="adventure-emblem" aria-hidden="true">CS</span><div><strong>CHOG SURVIVOR</strong><span className="adventure-demo-badge">LOCAL DEMO</span></div></div>
      <div className="adventure-stat-group"><span className="adventure-stat-disclosure">SIMULATED STATS · PREVIEWS DO NOT SAVE</span><dl className="adventure-stats" aria-label="Simulated character statistics">
        <div><dt>XP</dt><dd>{demoCharacter.xp}</dd></div><div><dt>Trust</dt><dd>{demoCharacter.trust}<small>/100</small></dd></div><div><dt>Scars</dt><dd>{demoCharacter.scars}<small>/100</small></dd></div><div><dt>Streak</dt><dd>{demoCharacter.streak}<small> days</small></dd></div>
      </dl></div>
      <button className="adventure-home" onClick={onHome}><span aria-hidden="true">←</span> Back to Home</button>
    </header>

    <div className="adventure-stage">
      <div className="adventure-world" role="img" aria-label="Moonlit forest with ruined stone gateways, a broken path, drifting mist and warm lanterns">
        <img className="adventure-environment" src={wildEnvironment} alt=""/>
        <div className="adventure-scene-wash"/>
        <img className="adventure-mist" src={fogOverlay} alt=""/>
        <div className="adventure-stone adventure-stone-left"><i/><i/><i/></div>
        <div className="adventure-stone adventure-stone-right"><i/><i/></div>
        <div className="adventure-lantern adventure-lantern-left"><i/></div>
        <div className="adventure-lantern adventure-lantern-right"><i/></div>
        <div className="adventure-foreground"><i/><i/><i/><i/><i/></div>
        <div className="adventure-world-edge"/>
      </div>
      <div className="adventure-scene-heading"><p className="adventure-eyebrow">DAILY ENCOUNTER · EVENT {String(eventIndex + 1).padStart(2, '0')} / 06</p><h1 id="adventure-title">{event.name}</h1><p>Every choice leaves a mark.</p></div>
      <div className="adventure-trail-tag"><span className="adventure-eyebrow">SIMULATED TRAIL</span><strong>{titles[demoCharacter.titleId]}</strong><span>{selectedToken === undefined ? 'Demo seed: token 0' : `Demo seed: token ${selectedToken}`} · Device UTC day {day}</span></div>
      <span className="adventure-scene-caption">THE RUINED WILD · DEMO SETTING</span>
    </div>

    <section className="adventure-controls" aria-labelledby="adventure-decision-title">
      <div className="adventure-story"><div><p className="adventure-eyebrow">YOUR NEXT MOVE</p><h2 id="adventure-decision-title">How will you survive?</h2></div><p>{event.narrative}</p></div>
      <div className="adventure-choices" aria-label="Survival choices">
        {event.choices.map((choice, index) => <button key={choice} className={`adventure-choice adventure-choice-${event.tags[index]}`} aria-haspopup="dialog" aria-pressed={selectedChoice === index} onClick={() => setPreview({eventIndex, choiceIndex: index})}>
          <span className="adventure-choice-top"><span className="adventure-choice-number">0{index + 1}</span><span>{event.tags[index]}</span></span>
          <strong>{choice}</strong><span className="adventure-choice-action">Preview Choice <span aria-hidden="true">→</span></span>
        </button>)}
      </div>
      <div className="adventure-demo-footer"><span>Choose any path to explore its rulebook trade-off. Previews are repeatable; simulated stats stay unchanged.</span><button disabled className="adventure-chain-action">Act onchain · Disabled</button></div>
    </section>
    <details className="adventure-chronicle"><summary>Simulated chronicle · {titles[demoCharacter.titleId]}</summary><p>Demo fixture only. No preview earns achievements or changes your Character screen.</p><ul>{achievements.map((name, index) => <li key={name}>{(demoCharacter.achievementMask & (1 << index)) !== 0 ? 'Demo unlocked' : 'Demo locked'} · {name}</li>)}</ul><p>Unmarked Week: {demoCharacter.unmarkedStreak}/7 qualifying consecutive daily actions (demo).</p></details>
    {preview && <ChoiceResult preview={preview} onReturn={() => setPreview(undefined)}/>}
  </section>
}
