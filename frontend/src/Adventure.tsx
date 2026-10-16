import {useEffect, useMemo, useState} from 'react'
import {achievements, demoCharacter, demoEventIndex, events, titles} from './game-data'
import {shortAddress, signed} from './utils'
import {useSurvivorIdentity} from './useSurvivorIdentity'
import {localMode, mainnetMode} from './contracts'
import {LocalContractAdventure} from './LocalContractAdventure'
import wildEnvironment from './assets/ruined-wild-environment-provisional.webp'
import fogOverlay from './assets/moonlit-fog-overlay-provisional.webp'
import './adventure.css'
import {emitGameSound} from './audio'
import {NewOwnerNotice, type AdventureNavigation} from './NewOwnerNotice'
import {MiniGamePanel} from './MiniGamePanel'
import {miniGameData} from './mini-game-data'
import {useAdventureDialog} from './useAdventureDialog'

type Preview = {eventIndex: number; choiceIndex: number}

function ChoiceResult({preview, tokenId, onReturn}: {preview: Preview; tokenId?: bigint; onReturn: () => void}) {
  const [stage, setStage] = useState<'interaction' | 'preview'>('interaction')
  const dialogRef = useAdventureDialog(stage)
  const event = events[preview.eventIndex]
  const deltas = event.baseDeltas[preview.choiceIndex]
  const category = event.tags[preview.choiceIndex]

  return <dialog ref={dialogRef} className={`adventure-result adventure-result-${category}${category === 'cautious' && stage === 'interaction' ? ' adventure-result-trial' : ''}`} aria-labelledby="preview-title" aria-describedby="preview-disclosure" onCancel={(event) => { event.preventDefault(); onReturn() }}>
    <div className="adventure-result-heading"><div className="adventure-result-stamp" aria-hidden="true"><i/><i/></div><div><p className="adventure-result-encounter">{event.name}</p><p className="adventure-eyebrow">{category} choice · LOCAL DEMO</p></div></div>
    <h2 id="preview-title">{event.choices[preview.choiceIndex]}</h2>
    {stage === 'interaction' ? <>
      <MiniGamePanel tokenId={tokenId} config={miniGameData[event.name].choices[preview.choiceIndex].interaction} onComplete={() => setStage('preview')} onSkip={() => setStage('preview')}/>
      <p id="preview-disclosure" className="adventure-result-disclosure">Local demonstration only. No progress is saved and no wallet signature is requested.</p>
      <button className="adventure-return-choice" onClick={onReturn}>CANCEL</button>
    </> : <>
    <p className="adventure-result-lede">Your choice leaves a mark. <span>Outcome {preview.eventIndex * 3 + preview.choiceIndex + 1}</span></p>
    <p className="adventure-result-story">{event.consequences[preview.choiceIndex]}</p>
    <p className="adventure-result-label">Rulebook base deltas · preview only</p>
    <dl className="adventure-result-rewards">
      {(['XP', 'Trust', 'Scars'] as const).map((label, index) => <div key={label} className={`adventure-reward-${label.toLowerCase()}`}><dt>{label}</dt><dd>{signed(deltas[index])}</dd></div>)}
    </dl>
    <p id="preview-disclosure" className="adventure-result-disclosure">Simulation only. These are documented base values, before history modifiers and clamping. No progress is saved, no wallet signature is requested, and nothing is sent onchain.</p>
    <button className="adventure-return-choice" onClick={onReturn}>TRY ANOTHER CHOICE <span aria-hidden="true">↻</span></button>
    </>}
    <p className="adventure-result-hint">Escape also returns to Adventure.</p>
  </dialog>
}

function DemoAdventure({now, selectedToken, onHome, onCharacter, onFindChogs, onHistory}: {now: number; selectedToken?: bigint; onHome: () => void} & AdventureNavigation) {
  const {owner, enabled, checkingOwner, verified, controls, ownershipMessage, contextKey} = useSurvivorIdentity(selectedToken)
  const day = Math.floor(now / 86400000)
  const eventIndex = useMemo(() => demoEventIndex(selectedToken ?? 0n, BigInt(day)), [selectedToken, day])
  const event = events[eventIndex]
  const [preview, setPreview] = useState<Preview>()
  const nonOwner = verified && !controls
  const mayPreview = selectedToken === undefined || controls
  useEffect(() => { setPreview(undefined) }, [contextKey, mayPreview])
  // Snapshot the event with the choice so a UTC rollover cannot change an open result.
  const selectedChoice = preview?.eventIndex === eventIndex ? preview.choiceIndex : undefined

  return <section className="adventure-game" aria-labelledby="adventure-title">
    <header className="adventure-hud">
      <div className="adventure-brand"><span className="adventure-emblem" aria-hidden="true">CS</span><div><strong>CHOG SURVIVOR</strong><span className="adventure-demo-badge">LOCAL DEMO</span></div></div>
      <div className="adventure-stat-group"><span className="adventure-stat-disclosure">DEMO STATS — NOT SAVED</span><dl className="adventure-stats" aria-label="Simulated character statistics">
        <div><dt>XP</dt><dd>{demoCharacter.xp}</dd></div><div><dt>Trust</dt><dd>{demoCharacter.trust}<small>/100</small></dd></div><div><dt>Scars</dt><dd>{demoCharacter.scars}<small>/100</small></dd></div><div><dt>Streak</dt><dd>{demoCharacter.streak}<small> days</small></dd></div>
      </dl></div>
      <button className="adventure-home" onClick={onHome}><span aria-hidden="true">←</span> Back to Home</button>
    </header>

    <aside className="adventure-survivor" aria-label="Adventure survivor identity">
      {nonOwner ? <NewOwnerNotice tokenId={selectedToken!} onFindChogs={onFindChogs} onHistory={onHistory ?? onCharacter}/> : <div role="status" aria-live="polite"><span className="adventure-survivor-label">{verified ? 'VERIFIED NFT IDENTITY · LOCAL DEMO' : 'LOCAL DEMONSTRATION'}</span>
        <strong>{verified ? `CHOG #${selectedToken}` : selectedToken === undefined ? 'No Chog selected' : `Requested token #${selectedToken} · unverified`}</strong>
        <p>{ownershipMessage}{selectedToken === undefined && ' Everyone can explore this demo.'}
          {verified && <span> Verified owner: {shortAddress(owner.data)} · {controls ? 'your wallet' : 'another wallet'}.</span>}</p>
      </div>}
      <p className="adventure-survivor-disclosure">The NFT carries progression; this encounter is a local demonstration. Choices do not change your Chog or save its story.</p>
      <div className="adventure-survivor-actions">
        {!nonOwner && onCharacter && <button type="button" onClick={onCharacter}>View survivor profile <span aria-hidden="true">→</span></button>}
        {selectedToken !== undefined && <button type="button" disabled={!enabled || checkingOwner} onClick={() => void owner.refetch()}>{checkingOwner ? 'Verifying…' : 'Refresh ownership'}</button>}
      </div>
    </aside>

    <div className="adventure-stage">
      <div className="adventure-world" role="img" aria-label="Moonlit forest with ruined stone gateways, a broken path, drifting mist and warm lanterns">
        <img className="adventure-environment" src={wildEnvironment} alt=""/>
        <div className="adventure-scene-wash"/>
        <img className="adventure-mist adventure-mist-back" src={fogOverlay} alt=""/>
        <img className="adventure-mist" src={fogOverlay} alt=""/>
        <div className="adventure-canopy"><i/><i/></div>
        <div className="adventure-stone adventure-stone-left"><i/><i/><i/></div>
        <div className="adventure-stone adventure-stone-right"><i/><i/></div>
        <div className="adventure-lantern adventure-lantern-left"><i/></div>
        <div className="adventure-lantern adventure-lantern-right"><i/></div>
        <div className="adventure-foreground"><i/><i/><i/><i/><i/></div>
        <div className="adventure-world-edge"/>
      </div>
      <div className="adventure-scene-heading"><div className="adventure-encounter-seal" data-encounter={eventIndex + 1} aria-hidden="true"><i/><i/><i/></div><div><p className="adventure-eyebrow">DAILY ENCOUNTER · EVENT {String(eventIndex + 1).padStart(2, '0')} / 06</p><h1 id="adventure-title">{event.name}</h1><p className="adventure-scene-motto">Every choice leaves a mark.</p></div></div>
      <div className="adventure-trail-tag"><span className="adventure-eyebrow">SIMULATED TRAIL</span><strong>{titles[demoCharacter.titleId]}</strong><span>{selectedToken === undefined ? 'Demo seed: token 0' : `Demo seed: token ${selectedToken}`} · Device UTC day {day}</span></div>
      <span className="adventure-scene-caption">THE RUINED WILD · DEMO SETTING</span>
    </div>

    <section className="adventure-controls" aria-labelledby="adventure-decision-title">
      <div className="adventure-story"><div><p className="adventure-eyebrow">YOUR NEXT MOVE</p><h2 id="adventure-decision-title">How will you survive?</h2></div><p>{event.narrative}</p></div>
      <div className="adventure-choices" aria-label="Survival choices">
        {event.choices.map((choice, index) => <button key={choice} className={`adventure-choice adventure-choice-${event.tags[index]}`} disabled={!mayPreview} aria-haspopup="dialog" aria-pressed={selectedChoice === index} onClick={() => { if (!mayPreview) return; emitGameSound('choice'); setPreview({eventIndex, choiceIndex: index}) }}>
          <span className="adventure-choice-top"><span className="adventure-choice-number">0{index + 1}</span><span className="adventure-choice-category">{event.tags[index]}</span></span>
          <strong>{choice}</strong><span className="adventure-choice-action">Preview Choice <span aria-hidden="true">→</span></span>
        </button>)}
      </div>
      <div className="adventure-demo-footer"><span>{mayPreview ? 'Choose any path to explore its rulebook trade-off. Previews are repeatable; simulated stats stay unchanged.' : 'Adventure choices and previews require verified ownership of this Chog.'}</span><button disabled className="adventure-chain-action">Act onchain · Disabled</button></div>
    </section>
    {!nonOwner && <details className="adventure-chronicle"><summary>Simulated chronicle · {titles[demoCharacter.titleId]}</summary><p>Demo fixture only. No preview earns achievements or changes your Character screen.</p><ul>{achievements.map((name, index) => <li key={name}>{(demoCharacter.achievementMask & (1 << index)) !== 0 ? 'Demo unlocked' : 'Demo locked'} · {name}</li>)}</ul><p>Unmarked Week: {demoCharacter.unmarkedStreak}/7 qualifying consecutive daily actions (demo).</p></details>}
    {mayPreview && preview && <ChoiceResult key={`${preview.eventIndex}:${preview.choiceIndex}`} preview={preview} tokenId={verified ? selectedToken : undefined} onReturn={() => setPreview(undefined)}/>}
  </section>
}

export function Adventure(props: {now: number; selectedToken?: bigint; onHome: () => void} & AdventureNavigation) {
  const [live, setLive] = useState(false)
  if (localMode) return <LocalContractAdventure {...props}/>
  return <>{mainnetMode && <button onClick={() => setLive(value => !value)}>{live ? 'Browse walletless simulation' : 'Play Monad mainnet · real MON gas'}</button>}{mainnetMode && live ? <LocalContractAdventure {...props}/> : <DemoAdventure {...props}/>}</>
}
