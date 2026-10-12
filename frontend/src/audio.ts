export type AudioPreferences = {enabled: boolean; muted: boolean; volume: number}

const storageKey = 'chog-survivor.audio-preferences'
export const defaultAudioPreferences: AudioPreferences = {enabled: true, muted: false, volume: 0.55}

function valid(value: unknown): value is AudioPreferences {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<AudioPreferences>
  return typeof candidate.enabled === 'boolean' && typeof candidate.muted === 'boolean' && typeof candidate.volume === 'number' && candidate.volume >= 0 && candidate.volume <= 1
}

export function loadAudioPreferences(storage: Storage | undefined = typeof window === 'undefined' ? undefined : window.localStorage): AudioPreferences {
  try { const value: unknown = JSON.parse(storage?.getItem(storageKey) ?? ''); return valid(value) ? value : defaultAudioPreferences } catch { return defaultAudioPreferences }
}

export function saveAudioPreferences(preferences: AudioPreferences, storage: Storage | undefined = typeof window === 'undefined' ? undefined : window.localStorage) {
  try { storage?.setItem(storageKey, JSON.stringify(preferences)) } catch { /* preferences must never block play */ }
}
