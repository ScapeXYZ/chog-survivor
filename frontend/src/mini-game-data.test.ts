import {describe, expect, it} from 'vitest'
import {events} from './game-data'
import {miniGameData, miniGameKindByCategory, type MiniGameConfig} from './mini-game-data'

type ConfiguredChoice = (typeof miniGameData)[keyof typeof miniGameData]['choices'][number]

describe('static mini-game configuration', () => {
  it('covers exactly the six existing encounters and all 18 choices', () => {
    expect(Object.keys(miniGameData)).toEqual(events.map(event => event.name))
    expect(Object.values(miniGameData).flatMap<ConfiguredChoice>(event => event.choices)).toHaveLength(18)
    for (const event of events) expect(miniGameData[event.name].choices).toHaveLength(event.choices.length)
  })

  it.each(events.map((event, eventIndex) => ({event, eventIndex})))('preserves IDs, labels, order and category mapping for $event.name', ({event, eventIndex}) => {
    const config = miniGameData[event.name]
    expect(config.encounterId).toBe(eventIndex + 1)
    config.choices.forEach((choice, choiceIndex) => {
      expect(choice.choiceId).toBe(choiceIndex + 1)
      expect(choice.label).toBe(event.choices[choiceIndex])
      expect(choice.category).toBe(event.tags[choiceIndex])
      expect(choice.interaction.kind).toBe(miniGameKindByCategory[event.tags[choiceIndex]])
      expect((config.encounterId - 1) * 3 + choice.choiceId).toBe(eventIndex * 3 + choiceIndex + 1)
    })
  })

  it('maps by category even where card positions differ', () => {
    expect(miniGameKindByCategory).toEqual({cautious: 'puzzle', reckless: 'timing', compassionate: 'story'})
    expect(miniGameData['Broken Bridge'].choices[0].interaction.kind).toBe('puzzle')
    expect(miniGameData['Hungry Stranger'].choices[0].interaction.kind).toBe('story')
    expect(miniGameData['Hungry Stranger'].choices[1].interaction.kind).toBe('puzzle')
    const kinds = Object.values(miniGameData).flatMap(event => event.choices.map(choice => choice.interaction.kind))
    for (const kind of ['puzzle', 'timing', 'story']) expect(kinds.filter(value => value === kind)).toHaveLength(6)
  })

  it('provides encounter-themed survival trials, short timing cues and two story responses', () => {
    const interactions: MiniGameConfig[] = Object.values(miniGameData).flatMap(event => event.choices.map(choice => choice.interaction))
    for (const interaction of interactions) {
      if (interaction.kind === 'puzzle') {
        expect(interaction.prompt.trim().length).toBeGreaterThan(0)
        expect(['bridge', 'camp', 'storm', 'runes', 'forest', 'shadow']).toContain(interaction.theme)
        expect(interaction.destination.trim().length).toBeGreaterThan(0)
        expect(interaction.hazard.trim().length).toBeGreaterThan(0)
        expect(Object.keys(interaction).sort()).toEqual(['destination', 'hazard', 'kind', 'prompt', 'theme'])
      } else if (interaction.kind === 'timing') {
        expect(interaction.cue.trim().length).toBeGreaterThan(0)
        expect(Number.isInteger(interaction.durationMs)).toBe(true)
        expect(interaction.durationMs).toBeGreaterThanOrEqual(2000)
        expect(interaction.durationMs).toBeLessThanOrEqual(5000)
      } else {
        expect(interaction.prompt.trim().length).toBeGreaterThan(0)
        expect(interaction.responses).toHaveLength(2)
        expect(new Set(interaction.responses).size).toBe(2)
        expect(interaction.responses.every(response => typeof response === 'string' && response.trim().length > 0)).toBe(true)
        // Plain text responses cannot override the enclosing contract choice ID.
        expect(Object.keys(interaction).sort()).toEqual(['kind', 'prompt', 'responses'])
      }
    }
  })
})
