import { createContext, useContext } from 'react'

export type MotionPreference = 'system' | 'full' | 'reduced'

export type MotionContextValue = {
  reduced: boolean
  preference: MotionPreference
  toggle: () => void
  setPreference: (preference: MotionPreference) => void
}

export const MotionContext = createContext<MotionContextValue | null>(null)

export function useMotion() {
  const context = useContext(MotionContext)
  if (!context) throw new Error('useMotion must be used inside MotionProvider')
  return context
}
