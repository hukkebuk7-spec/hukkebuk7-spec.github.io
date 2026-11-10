export const JARVIS_OPEN_EVENT = 'tempo:jarvis-open'
export const JARVIS_WAKE_EVENT = 'tempo:jarvis-wake'

export type JarvisWakeDetail = {
  command?: string
}

export function openJarvis() {
  window.dispatchEvent(new Event(JARVIS_OPEN_EVENT))
}

export function wakeJarvis(command = '') {
  window.dispatchEvent(
    new CustomEvent<JarvisWakeDetail>(JARVIS_WAKE_EVENT, { detail: { command } }),
  )
}
