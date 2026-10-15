import chogIllustration from './assets/survivor-creature-refined-provisional.webp'
import {achievements} from './game-data'
import {survivorReflection, utcEvidence, type ReflectedOutcome} from './survivorReflection'

export function ConfirmedSurvivorReaction({outcome, earnedAchievementIds, timestamp}: {outcome: ReflectedOutcome & {tokenId: bigint; day: bigint}; earnedAchievementIds: readonly number[]; timestamp?: bigint}) {
  const reflection = survivorReflection(outcome)
  const date = timestamp === undefined ? undefined : utcEvidence(timestamp)
  if (!reflection) return null
  return <section className="confirmed-survivor-reaction" aria-label="Confirmed Chog reaction" role="status" aria-live="polite" aria-atomic="true">
    <img className="confirmed-chog-illustration" src={chogIllustration} alt=""/>
    <p className="adventure-eyebrow">CHOG #{outcome.tokenId.toString()} · A RECORDED MEMORY</p>
    <p className="confirmed-reflection">“{reflection}”</p>
    <p>UTC day {outcome.day.toString()}{date && <> · <time dateTime={date.iso}>{date.label}</time></>}</p>
    {earnedAchievementIds.length > 0 && <p className="confirmed-achievements">New achievements: {earnedAchievementIds.map(id => achievements[id]).join(', ')}</p>}
  </section>
}
