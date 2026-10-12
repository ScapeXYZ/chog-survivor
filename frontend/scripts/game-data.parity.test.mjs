// @vitest-environment node
import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'
import {encodePacked, keccak256} from 'viem'
import {CHOG_GENESIS} from '../src/contracts'
import {demoEventIndex, events} from '../src/game-data'
const source = readFileSync(new URL('../../src/ChogSurvivor.sol', import.meta.url), 'utf8')
const rules = readFileSync(new URL('../../docs/GAME_RULES.md', import.meta.url), 'utf8')

function frozenArray(name) {
  const values = source.match(new RegExp(`memory ${name}\\s*=\\s*\\[([^\\]]+)\\]`))?.[1]
  if (!values) throw new Error(`Missing frozen Solidity table ${name}`)
  return values.replace(/(?:int(?:32|16)|uint8)\((-?\d+)\)/g, '$1').split(',').map((value) => Number(value.trim()))
}

describe('frozen backend parity', () => {
  it('maps all six events, three choices and eighteen outcomes to the rulebook', () => {
    const rows = [...rules.matchAll(/\| ([^|]*) \| ([^|]+) \| (cautious|reckless|compassionate) \| ([^|]+) \|/g)]
    expect(events).toHaveLength(6)
    expect(rows).toHaveLength(18)
    let eventId = 0
    rows.forEach((row, index) => {
      const eventName = row[1].trim()
      const entry = events[Math.floor(index / 3)]
      if (eventName) {
        eventId = Number(eventName.match(/\((\d)\)/)?.[1])
        expect(eventName).toBe(`${entry.name} (${Math.floor(index / 3) + 1})`)
      }
      const choiceId = index % 3 + 1
      const outcomeId = (eventId - 1) * 3 + choiceId
      expect(outcomeId).toBe(index + 1)
      expect(row[2].trim()).toBe(`${entry.choices[choiceId - 1]} (${choiceId}) / ${outcomeId}`)
      expect(row[3]).toBe(entry.tags[choiceId - 1])
      expect(row[4].trim().split(',').map(Number)).toEqual([...entry.baseDeltas[choiceId - 1]])
    })
  })
  it('matches every base delta and modifier category in the frozen Solidity arrays', () => {
    const xs = frozenArray('xs'), ts = frozenArray('ts'), ss = frozenArray('ss'), tags = frozenArray('tags')
    const outcomes = events.flatMap((event) => event.baseDeltas.map((delta) => [...delta]))
    expect(outcomes).toHaveLength(18)
    outcomes.forEach((deltas, index) => expect([...deltas]).toEqual([xs[index], ts[index], ss[index]]))
    expect(events.flatMap((event) => event.tags.map((tag) => tag))).toEqual(tags.map((tag) => ['cautious', 'reckless', 'compassionate'][tag]))
    expect(source).toContain('uint8 outcomeId = (eventId - 1) * 3 + choiceId;')
    expect(source).toContain('if (choiceId < 1 || choiceId > 3) revert InvalidChoice(choiceId);')
  })
  it('preserves the local deterministic formula while distinguishing its device-day input', () => {
    expect(source).toContain('keccak256(abi.encodePacked(CHOG_GENESIS, tokenId, day))) % 6) + 1')
    for (const token of [0n, 1425n, (1n << 256n) - 1n]) for (const day of [0n, 20740n, 20741n]) {
      const eventId = Number(BigInt(keccak256(encodePacked(['address', 'uint256', 'uint64'], [CHOG_GENESIS, token, day]))) % 6n) + 1
      expect(demoEventIndex(token, day) + 1).toBe(eventId)
    }
  })
})
