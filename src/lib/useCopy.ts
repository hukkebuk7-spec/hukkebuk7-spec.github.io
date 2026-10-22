import { useCallback, useEffect, useRef, useState } from 'react'

export function useCopy(resetAfter = 1800) {
  const [copied, setCopied] = useState(false)
  const timeout = useRef<number | undefined>(undefined)

  const copy = useCallback(
    async (text: string) => {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text)
        } else {
          const area = document.createElement('textarea')
          area.value = text
          area.setAttribute('readonly', '')
          area.style.position = 'fixed'
          area.style.opacity = '0'
          document.body.appendChild(area)
          area.select()
          document.execCommand('copy')
          area.remove()
        }
        setCopied(true)
        window.clearTimeout(timeout.current)
        timeout.current = window.setTimeout(() => setCopied(false), resetAfter)
      } catch {
        setCopied(false)
      }
    },
    [resetAfter],
  )

  useEffect(() => () => window.clearTimeout(timeout.current), [])

  return { copied, copy }
}
