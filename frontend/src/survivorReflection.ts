import {events} from './game-data'

export type ReflectedOutcome = {eventId: number; choiceId: number; outcomeId: number; xpDelta: number; trustDelta: number; scarsDelta: number}
// Editorial reflections on the recorded choice, never contract-authored dialogue
// or a prediction derived from the mini-game or its difficulty.
const reflections = [
  ['I steadied the crossing, one support at a time.', 'I took the leap across the broken bridge.', 'I guided the others along the riverbank.'],
  ['I shared my rations in the cold.', 'I paused to hear the stranger’s story.', 'I sent the stranger away from the trail.'],
  ['I held my place beneath the shelter.', 'I followed the call into the storm.', 'I ran into the midnight rain.'],
  ['I traced the ancient runes with care.', 'I opened the gate for those behind me.', 'I pressed against the weathered seal.'],
  ['I led the lost Chog toward home.', 'I marked the trail for the lost Chog.', 'I followed the distant cry between the trees.'],
  ['I placed a ward at the edge of camp.', 'I drew the beast away from the lanterns.', 'I stood before the shadow beast.'],
] as const
export function survivorReflection(outcome: ReflectedOutcome): string | undefined {
  const {eventId, choiceId, outcomeId, xpDelta, trustDelta, scarsDelta} = outcome
  if (!Number.isInteger(eventId) || eventId < 1 || eventId > events.length || !Number.isInteger(choiceId) || choiceId < 1 || choiceId > 3 || outcomeId !== (eventId - 1) * 3 + choiceId || ![xpDelta, trustDelta, scarsDelta].every(Number.isFinite)) return undefined
  const trust = trustDelta > 0 ? 'Trust grew.' : trustDelta < 0 ? 'Trust fell.' : 'Trust held steady.'
  const scars = scarsDelta > 0 ? 'New scars were recorded.' : scarsDelta < 0 ? 'Recorded scars decreased.' : 'Scars stayed unchanged.'
  return `${reflections[eventId - 1][choiceId - 1]} ${trust} ${scars}`
}
export function utcEvidence(timestamp: bigint): {iso: string; label: string} | undefined {
  const date = new Date(Number(timestamp) * 1000)
  if (!Number.isFinite(date.getTime())) return undefined
  return {iso: date.toISOString(), label: date.toUTCString()}
}
