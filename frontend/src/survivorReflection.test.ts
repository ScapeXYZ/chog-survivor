import {describe, expect, it} from 'vitest'
import {events} from './game-data'
import {survivorReflection, utcEvidence} from './survivorReflection'
describe('confirmed survivor reflection formatting', () => {
  it.each(events.flatMap((event, eventIndex) => event.choices.map((choice, choiceIndex) => ({choice, eventId: eventIndex + 1, choiceId: choiceIndex + 1, outcomeId: eventIndex * 3 + choiceIndex + 1}))))('covers the recorded $choice', outcome => {
    const text = survivorReflection({...outcome, xpDelta: 99, trustDelta: -2, scarsDelta: 0})
    expect(text).toBeTruthy(); expect(text).toContain('Trust fell.'); expect(text).toContain('Scars stayed unchanged.')
    expect(text).not.toMatch(/XP|achievement|reward|supply/i)
  })
  it('uses actual clamped deltas rather than category/base consequences', () => {
    const base = {eventId: 6, choiceId: 3, outcomeId: 18, xpDelta: 0, trustDelta: 0, scarsDelta: 0}
    expect(survivorReflection(base)).toContain('Trust held steady. Scars stayed unchanged.')
    expect(survivorReflection({...base, trustDelta: 3, scarsDelta: 2})).toContain('Trust grew. New scars were recorded.')
    expect(survivorReflection({...base, scarsDelta: -1})).toContain('Recorded scars decreased.')
  })
  it.each([{eventId: 7}, {eventId: 1.1}, {choiceId: 0}, {choiceId: 4}, {outcomeId: 18}, {xpDelta: NaN}])('does not invent a reflection for unsupported evidence %j', override => {
    expect(survivorReflection({eventId: 1, choiceId: 1, outcomeId: 1, xpDelta: 0, trustDelta: 0, scarsDelta: 0, ...override})).toBeUndefined()
  })
  it('uses the recorded UTC block timestamp and rejects invalid dates', () => {
    expect(utcEvidence(86400n)?.iso).toBe('1970-01-02T00:00:00.000Z')
    expect(utcEvidence(10n ** 30n)).toBeUndefined()
  })
})
