export type AudioPreferences = {
  musicEnabled: boolean
  effectsEnabled: boolean
  muted: boolean
  masterVolume: number
  musicVolume: number
  effectsVolume: number
}

export type GameSound = 'button' | 'enter-adventure' | 'choice' | 'dialog-open' | 'confirmed' | 'failed' | 'achievement' | 'daily-lock' | 'test'

const storageKey = 'chog-survivor.audio-preferences'
export const defaultAudioPreferences: AudioPreferences = {musicEnabled: true, effectsEnabled: true, muted: false, masterVolume: .7, musicVolume: .42, effectsVolume: .65}
const inRange = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1

function valid(value: unknown): value is AudioPreferences {
  if (!value || typeof value !== 'object') return false
  const v = value as Partial<AudioPreferences>
  return typeof v.musicEnabled === 'boolean' && typeof v.effectsEnabled === 'boolean' && typeof v.muted === 'boolean' && inRange(v.masterVolume) && inRange(v.musicVolume) && inRange(v.effectsVolume)
}

export function loadAudioPreferences(storage: Storage | undefined = typeof window === 'undefined' ? undefined : window.localStorage): AudioPreferences {
  try {
    const value: unknown = JSON.parse(storage?.getItem(storageKey) ?? '')
    if (valid(value)) return value
    // Preserve the original three-field preference format from Milestone 12.
    const legacy = value as {enabled?: unknown; muted?: unknown; volume?: unknown}
    if (typeof legacy?.enabled === 'boolean' && typeof legacy.muted === 'boolean' && inRange(legacy.volume)) return {...defaultAudioPreferences, musicEnabled: legacy.enabled, effectsEnabled: legacy.enabled, muted: legacy.muted, masterVolume: legacy.volume}
  } catch {}
  return defaultAudioPreferences
}

export function saveAudioPreferences(preferences: AudioPreferences, storage: Storage | undefined = typeof window === 'undefined' ? undefined : window.localStorage) {
  try { storage?.setItem(storageKey, JSON.stringify(preferences)) } catch {}
}

export function emitGameSound(sound: GameSound) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent<GameSound>('chog-game-sound', {detail: sound}))
}

export function emitTransactionResult(success: boolean, achievementMask = 0n) {
  if (!success) return emitGameSound('failed')
  if (achievementMask !== 0n) emitGameSound('achievement')
  emitGameSound('confirmed')
}

type ContextFactory = () => AudioContext

/** Original procedural score: a D-minor forest motif, synthesized locally. */
export class GameAudioEngine {
  private context?: AudioContext
  private master?: GainNode
  private music?: GainNode
  private effects?: GainNode
  private drones: OscillatorNode[] = []
  private sequence?: number
  private started = false
  private disposed = false
  private preferences: AudioPreferences
  private readonly createContext: ContextFactory

  constructor(preferences: AudioPreferences, createContext: ContextFactory = () => new AudioContext()) {
    this.preferences = preferences
    this.createContext = createContext
  }

  get active() { return this.started && this.context?.state === 'running' }
  get musicPlaying() { return this.drones.length > 0 }

  update(preferences: AudioPreferences) {
    this.preferences = preferences
    this.applyLevels()
    if (this.started && preferences.musicEnabled && !preferences.muted) this.startMusic()
    else if (!preferences.musicEnabled || preferences.muted) this.stopMusic()
  }

  async unlock(): Promise<'playing' | 'blocked' | 'silent'> {
    if (this.disposed) return 'silent'
    try {
      if (!this.context) {
        this.context = this.createContext()
        this.master = this.context.createGain(); this.music = this.context.createGain(); this.effects = this.context.createGain()
        this.music.connect(this.master); this.effects.connect(this.master); this.master.connect(this.context.destination)
        this.applyLevels()
      }
      // Nodes scheduled during the activating gesture begin after resume.
      this.started = true
      if (this.context.state !== 'running') await this.context.resume()
      if (this.preferences.musicEnabled && !this.preferences.muted) this.startMusic()
      return this.preferences.muted || (!this.preferences.musicEnabled && !this.preferences.effectsEnabled) ? 'silent' : 'playing'
    } catch { this.started = false; return 'blocked' }
  }

  play(sound: GameSound) {
    if (!this.started || !this.context || !this.effects || this.preferences.muted || !this.preferences.effectsEnabled) return
    const patterns: Record<GameSound, Array<[number, number, number]>> = {
      button: [[440, .018, .055]],
      'enter-adventure': [[146.83, .04, .22], [220, .15, .3]],
      choice: [[293.66, .02, .12], [392, .1, .16]],
      'dialog-open': [[523.25, .02, .09], [659.25, .08, .14]],
      confirmed: [[293.66, .03, .16], [440, .12, .2], [587.33, .25, .34]],
      failed: [[196, .03, .2], [146.83, .16, .3]],
      achievement: [[392, .02, .2], [523.25, .15, .22], [783.99, .3, .42]],
      'daily-lock': [[110, .03, .14], [110, .2, .14]],
      test: [[293.66, .02, .14], [440, .13, .18], [587.33, .28, .3]],
    }
    const now = this.context.currentTime
    for (const [frequency, offset, duration] of patterns[sound]) this.note(frequency, now + offset, duration, sound === 'failed' || sound === 'daily-lock' ? 'triangle' : 'sine', .12, this.effects)
  }

  dispose() {
    this.disposed = true
    this.stopMusic()
    void this.context?.close()
    this.context = undefined
  }

  private applyLevels() {
    if (!this.context || !this.master || !this.music || !this.effects) return
    const t = this.context.currentTime
    this.master.gain.setTargetAtTime(this.preferences.muted ? 0 : this.preferences.masterVolume, t, .02)
    this.music.gain.setTargetAtTime(this.preferences.musicEnabled ? this.preferences.musicVolume : 0, t, .03)
    this.effects.gain.setTargetAtTime(this.preferences.effectsEnabled ? this.preferences.effectsVolume : 0, t, .02)
  }

  private startMusic() {
    if (!this.context || !this.music || this.drones.length || this.disposed) return
    for (const [frequency, gainValue] of [[73.42, .055], [110, .025]] as const) {
      const oscillator = this.context.createOscillator(), gain = this.context.createGain()
      oscillator.type = 'sine'; oscillator.frequency.value = frequency; gain.gain.value = gainValue
      oscillator.connect(gain); gain.connect(this.music); oscillator.start(); this.drones.push(oscillator)
    }
    const motif = [146.83, 174.61, 220, 196, 261.63, 220, 174.61, 164.81]
    let step = 0
    const phrase = () => {
      if (!this.context || !this.music) return
      const now = this.context.currentTime
      this.note(motif[step++ % motif.length], now, 1.8, 'sine', .045, this.music)
      if (step % 2 === 0) this.note(55, now, .22, 'triangle', .035, this.music)
    }
    phrase()
    this.sequence = window.setInterval(phrase, 2400)
  }

  private stopMusic() {
    if (this.sequence !== undefined) window.clearInterval(this.sequence)
    this.sequence = undefined
    for (const oscillator of this.drones) { try { oscillator.stop() } catch {} }
    this.drones = []
  }

  private note(frequency: number, start: number, duration: number, type: OscillatorType, level: number, destination: AudioNode) {
    if (!this.context) return
    const oscillator = this.context.createOscillator(), gain = this.context.createGain()
    oscillator.type = type; oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(.0001, start); gain.gain.exponentialRampToValueAtTime(level, start + .025); gain.gain.exponentialRampToValueAtTime(.0001, start + duration)
    oscillator.connect(gain); gain.connect(destination); oscillator.start(start); oscillator.stop(start + duration + .03)
  }
}
