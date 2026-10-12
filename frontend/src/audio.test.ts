import {describe, expect, it} from 'vitest'
import {defaultAudioPreferences, loadAudioPreferences, saveAudioPreferences} from './audio'

function memoryStorage(): Storage {
  const values = new Map<string, string>()
  return {get length() { return values.size }, clear: () => values.clear(), getItem: (key) => values.get(key) ?? null, key: () => null, removeItem: (key) => values.delete(key), setItem: (key, value) => values.set(key, value)}
}

describe('audio preferences', () => {
  it('defaults to enabled sound with audible volume', () => expect(loadAudioPreferences(memoryStorage())).toEqual(defaultAudioPreferences))
  it('persists mute and volume choices', () => { const storage = memoryStorage(); saveAudioPreferences({enabled: true, muted: true, volume: .25}, storage); expect(loadAudioPreferences(storage)).toEqual({enabled: true, muted: true, volume: .25}) })
})
