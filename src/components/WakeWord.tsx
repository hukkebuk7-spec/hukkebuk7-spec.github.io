import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getSpeechRecognition,
  parseWakePhrase,
  setWakePreference,
  useWakePreference,
  type SpeechRecognitionLike,
} from '../lib/wake-word'
import { JARVIS_WAKE_EVENT, openJarvis } from '../lib/jarvis-events'

type WakeState = 'idle' | 'listening' | 'blocked' | 'error'

export function WakeWord({ paused }: { paused: boolean }) {
  const enabled = useWakePreference()
  const [supported] = useState(() => Boolean(getSpeechRecognition()))
  const [state, setState] = useState<WakeState>('idle')
  const [message, setMessage] = useState('')
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const restartRef = useRef<number | undefined>(undefined)
  const startRef = useRef<() => void>(() => undefined)
  const enabledRef = useRef(enabled)
  const pausedRef = useRef(paused)
  const blockedRef = useRef(false)
  const handledRef = useRef(false)

  useEffect(() => {
    enabledRef.current = enabled
    pausedRef.current = paused
  }, [enabled, paused])

  const stop = useCallback(() => {
    window.clearTimeout(restartRef.current)
    restartRef.current = undefined
    const recognition = recognitionRef.current
    recognitionRef.current = null
    if (recognition) {
      recognition.onstart = null
      recognition.onend = null
      recognition.onresult = null
      recognition.onerror = null
      try {
        recognition.abort()
      } catch {
        /* Already stopped. */
      }
    }
    if (!blockedRef.current) setState('idle')
  }, [])

  const start = useCallback(() => {
    if (!enabledRef.current || pausedRef.current || handledRef.current) return
    if (recognitionRef.current) return
    const Recognition = getSpeechRecognition()
    if (!Recognition) return
    let recognition: SpeechRecognitionLike
    try {
      recognition = new Recognition()
    } catch {
      setState('error')
      setMessage('Wake word paused')
      return
    }

    recognition.lang = navigator.language || 'en-US'
    recognition.continuous = true
    recognition.interimResults = true
    recognitionRef.current = recognition

    recognition.onstart = () => {
      blockedRef.current = false
      setState('listening')
      setMessage('')
    }

    recognition.onresult = (event) => {
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        if (!result?.isFinal) continue
        const wake = parseWakePhrase(result[0]?.transcript ?? '')
        if (!wake) continue
        handledRef.current = true
        stop()
        openJarvis()
        window.dispatchEvent(
          new CustomEvent(JARVIS_WAKE_EVENT, { detail: { command: wake.command } }),
        )
        break
      }
    }

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        blockedRef.current = true
        setState('blocked')
        setMessage('Microphone blocked')
      } else if (event.error === 'audio-capture') {
        blockedRef.current = true
        setState('blocked')
        setMessage('No microphone found')
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setState('error')
        setMessage('Wake word needs a moment')
      }
    }

    recognition.onend = () => {
      recognitionRef.current = null
      if (!enabledRef.current || pausedRef.current || handledRef.current) return
      if (document.visibilityState !== 'visible' || blockedRef.current) return
      restartRef.current = window.setTimeout(() => startRef.current(), 900)
    }

    try {
      recognition.start()
    } catch {
      recognitionRef.current = null
      blockedRef.current = true
      setState('blocked')
      setMessage('Tap to arm the microphone')
    }
  }, [stop])

  useEffect(() => {
    startRef.current = start
  }, [start])

  useEffect(() => {
    if (!supported) return
    if (!enabled || paused) {
      stop()
      if (!paused) handledRef.current = false
      return
    }
    handledRef.current = false
    const timer = window.setTimeout(() => startRef.current(), 0)
    return () => window.clearTimeout(timer)
  }, [enabled, paused, supported, start, stop])

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && enabledRef.current && !pausedRef.current) {
        startRef.current()
      } else {
        stop()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [stop])

  useEffect(() => {
    if (!enabled || state !== 'blocked') return
    const onGesture = () => {
      blockedRef.current = false
      setState('idle')
      setMessage('')
      startRef.current()
    }
    window.addEventListener('pointerdown', onGesture, { once: true })
    return () => window.removeEventListener('pointerdown', onGesture)
  }, [enabled, state, start])

  if (!enabled || !supported || paused) return null

  const label =
    state === 'blocked'
      ? message || 'Microphone blocked'
      : state === 'error'
        ? message || 'Wake word paused'
        : 'Listening for “Jarvis”'

  return (
    <div className={`wakeword wakeword--${state}`} role="status" aria-live="polite">
      <span className="wakeword__dot" aria-hidden="true" />
      <span className="wakeword__label mono">{label}</span>
      <button
        type="button"
        className="wakeword__off"
        onClick={() => {
          handledRef.current = false
          setWakePreference(false)
        }}
        aria-label="Turn off the Jarvis wake word"
      >
        Off
      </button>
    </div>
  )
}
