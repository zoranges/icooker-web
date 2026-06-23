import { DashScopeVoiceName } from './dashscopeTts'

export interface TtsSettings {
  voice: DashScopeVoiceName
  language: 'Chinese' | 'English' | 'Japanese' | 'Korean' | 'French'
  rate: number   // 0.5 ~ 2.0
  volume: number // 0.1 ~ 1.0
}

const STORAGE_KEY = 'icooker_tts_settings'

const defaults: TtsSettings = {
  voice: 'Ethan',
  language: 'Chinese',
  rate: 1.0,
  volume: 1.0,
}

export function getTtsSettings(): TtsSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaults }
    return { ...defaults, ...JSON.parse(raw) }
  } catch {
    return { ...defaults }
  }
}

export function saveTtsSettings(s: TtsSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

export function resetTtsSettings(): void {
  localStorage.removeItem(STORAGE_KEY)
}
