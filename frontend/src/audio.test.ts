import {afterEach, describe, expect, it, vi} from 'vitest'
import {defaultAudioPreferences, emitTransactionResult, GameAudioEngine, loadAudioPreferences, saveAudioPreferences} from './audio'

function memoryStorage(): Storage {
  const values = new Map<string, string>()
  return {get length() { return values.size }, clear: () => values.clear(), getItem: (key) => values.get(key) ?? null, key: () => null, removeItem: (key) => values.delete(key), setItem: (key, value) => values.set(key, value)}
}

describe('audio preferences', () => {
  it('defaults to enabled sound with audible volume', () => expect(loadAudioPreferences(memoryStorage())).toEqual(defaultAudioPreferences))
  it('persists all channel, mute and volume choices', () => { const storage = memoryStorage(); const value = {musicEnabled: false, effectsEnabled: true, muted: true, masterVolume: .25, musicVolume: .3, effectsVolume: .8}; saveAudioPreferences(value, storage); expect(loadAudioPreferences(storage)).toEqual(value) })
  it('migrates the original preference format', () => { const storage = memoryStorage(); storage.setItem('chog-survivor.audio-preferences', JSON.stringify({enabled: false, muted: true, volume: .2})); expect(loadAudioPreferences(storage)).toEqual({...defaultAudioPreferences, musicEnabled: false, effectsEnabled: false, muted: true, masterVolume: .2}) })
  it('rejects malformed and out-of-range preferences', () => { const storage = memoryStorage(); storage.setItem('chog-survivor.audio-preferences', JSON.stringify({...defaultAudioPreferences, effectsVolume: 2})); expect(loadAudioPreferences(storage)).toEqual(defaultAudioPreferences) })
})

class FakeParam {
  value = 0
  targets: number[] = []
  setTargetAtTime(value: number) { this.targets.push(value); this.value = value }
  setValueAtTime(value: number) { this.value = value }
  exponentialRampToValueAtTime(value: number) { this.value = value }
}
class FakeGain { gain = new FakeParam(); connect = vi.fn() }
class FakeOscillator { type: OscillatorType = 'sine'; frequency = {value: 0}; connect = vi.fn(); start = vi.fn(); stop = vi.fn() }
class FakeContext {
  state: AudioContextState = 'suspended'; currentTime = 0; destination = {}
  gains: FakeGain[] = []; oscillators: FakeOscillator[] = []
  resume = vi.fn(async () => { this.state = 'running' })
  close = vi.fn(async () => { this.state = 'closed' })
  createGain = () => { const gain = new FakeGain(); this.gains.push(gain); return gain }
  createOscillator = () => { const oscillator = new FakeOscillator(); this.oscillators.push(oscillator); return oscillator }
}

describe('audio engine', () => {
  afterEach(() => vi.useRealTimers())
  it('unlocks once, loops one score, and cleans up its context', async () => {
    vi.useFakeTimers(); const context = new FakeContext(); const engine = new GameAudioEngine(defaultAudioPreferences, () => context as unknown as AudioContext)
    await expect(engine.unlock()).resolves.toBe('playing'); const count = context.oscillators.length
    await engine.unlock(); expect(context.resume).toHaveBeenCalledTimes(1); expect(context.oscillators).toHaveLength(count); expect(engine.musicPlaying).toBe(true)
    engine.dispose(); expect(context.close).toHaveBeenCalledOnce(); expect(context.oscillators.slice(0, 2).every((node) => node.stop.mock.calls.length > 0)).toBe(true)
  })
  it('applies mute and independent channel toggles immediately', async () => {
    vi.useFakeTimers(); const context = new FakeContext(); const engine = new GameAudioEngine(defaultAudioPreferences, () => context as unknown as AudioContext); await engine.unlock()
    engine.update({...defaultAudioPreferences, muted: true}); expect(context.gains[0].gain.targets.at(-1)).toBe(0); expect(engine.musicPlaying).toBe(false)
    const count = context.oscillators.length; engine.play('choice'); expect(context.oscillators).toHaveLength(count)
    engine.update({...defaultAudioPreferences, musicEnabled: false, effectsEnabled: true}); engine.play('choice'); expect(context.oscillators.length).toBeGreaterThan(count)
  })
  it('reports autoplay resume rejection without starting music', async () => {
    const context = new FakeContext(); context.resume = vi.fn(async () => { throw new Error('blocked') }); const engine = new GameAudioEngine(defaultAudioPreferences, () => context as unknown as AudioContext)
    await expect(engine.unlock()).resolves.toBe('blocked'); expect(engine.active).toBe(false); expect(engine.musicPlaying).toBe(false)
  })
  it('sets all three volume gains and suppresses disabled effects', async () => {
    vi.useFakeTimers(); const context = new FakeContext(); const engine = new GameAudioEngine(defaultAudioPreferences, () => context as unknown as AudioContext)
    engine.play('test'); expect(context.oscillators).toHaveLength(0)
    await engine.unlock()
    engine.update({...defaultAudioPreferences, masterVolume: .2, musicVolume: .3, effectsVolume: .4})
    expect(context.gains.slice(0, 3).map(gain => gain.gain.targets.at(-1))).toEqual([.2, .3, .4])
    engine.update({...defaultAudioPreferences, effectsEnabled: false})
    const count = context.oscillators.length; engine.play('test'); expect(context.oscillators).toHaveLength(count)
    engine.dispose()
  })
  it('emits confirmed, achievement, and failed transaction cues only when told', () => {
    const heard: string[] = []; const listener = (event: Event) => heard.push((event as CustomEvent<string>).detail); window.addEventListener('chog-game-sound', listener)
    emitTransactionResult(true, 2n); emitTransactionResult(false); window.removeEventListener('chog-game-sound', listener)
    expect(heard).toEqual(['achievement', 'confirmed', 'failed'])
  })
})
