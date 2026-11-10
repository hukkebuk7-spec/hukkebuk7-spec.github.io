import { useSyncExternalStore } from 'react'

export const WAKE_STORAGE_KEY = 'tempo:wake'
const WAKE_CHANGE_EVENT = 'tempo:wake-change'

export type SpeechResult = {
  0: { transcript: string }
  isFinal: boolean
  length: number
}

export type SpeechResultList = {
  length: number
  [index: number]: SpeechResult
}

export type SpeechRecognitionEventLike = {
  resultIndex: number
  results: SpeechResultList
}

export type SpeechRecognitionErrorLike = {
  error: string
}

export type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onstart: (() => void) | null
  onend: (() => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null
}

export type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
}

export function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  const speechWindow = window as SpeechWindow
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null
}

export function readWakePreference(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(WAKE_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function setWakePreference(enabled: boolean) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(WAKE_STORAGE_KEY, enabled ? '1' : '0')
  } catch {
    /* The listener still works for this session. */
  }
  window.dispatchEvent(new Event(WAKE_CHANGE_EVENT))
}

function subscribeWake(callback: () => void) {
  if (typeof window === 'undefined') return () => undefined
  const onChange = () => callback()
  window.addEventListener(WAKE_CHANGE_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(WAKE_CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

export function useWakePreference(): boolean {
  return useSyncExternalStore(subscribeWake, readWakePreference, () => false)
}

const wakePattern = /\b(?:hey\s+|ok(?:ay)?\s+)?(?:jarvis|jervis|javis|jarvas)\b/i

export function parseWakePhrase(transcript: string): { command: string } | null {
  const match = wakePattern.exec(transcript)
  if (!match) return null
  const command = transcript
    .slice(match.index + match[0].length)
    .replace(/^[\s,.;:!?—–-]+/, '')
    .trim()
  return { command }
}
