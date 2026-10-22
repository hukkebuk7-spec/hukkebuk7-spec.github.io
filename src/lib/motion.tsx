import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { MotionContext } from './motion-context'
import type { MotionPreference } from './motion-context'

const STORAGE_KEY = 'tempo:motion'

function readStoredPreference(): MotionPreference {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'full' || stored === 'reduced') return stored
  } catch {
    /* Storage can be unavailable; fall back to the system preference. */
  }
  return 'system'
}

export function MotionProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<MotionPreference>(() => readStoredPreference())
  const [systemReduced, setSystemReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (event: MediaQueryListEvent) => setSystemReduced(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const reduced = preference === 'system' ? systemReduced : preference === 'reduced'

  useEffect(() => {
    document.documentElement.dataset.motion = preference === 'system' ? 'system' : preference
  }, [preference])

  const setPreference = useCallback((next: MotionPreference) => {
    setPreferenceState(next)
    try {
      if (next === 'system') window.localStorage.removeItem(STORAGE_KEY)
      else window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* Preference still applies for this session. */
    }
  }, [])

  const toggle = useCallback(() => {
    setPreference(reduced ? 'full' : 'reduced')
  }, [reduced, setPreference])

  const value = useMemo(
    () => ({ reduced, preference, toggle, setPreference }),
    [reduced, preference, toggle, setPreference],
  )

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>
}
