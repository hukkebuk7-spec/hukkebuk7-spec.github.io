import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useMotion } from '../lib/motion-context'

type RevealProps = {
  children: ReactNode
  as?: 'div' | 'section' | 'article' | 'li' | 'figure' | 'header' | 'aside'
  className?: string
  delay?: number
  fade?: boolean
  id?: string
}

export function Reveal({ children, as = 'div', className = '', delay = 0, fade = false, id }: RevealProps) {
  const Tag = as
  const ref = useRef<HTMLElement | null>(null)
  const { reduced } = useMotion()

  useEffect(() => {
    const node = ref.current
    if (!node) return
    node.classList.remove('reveal--armed', 'is-in')

    if (reduced || !('IntersectionObserver' in window)) {
      node.classList.add('is-in')
      return
    }

    node.classList.add('reveal--armed')
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            node.classList.add('is-in')
            observer.disconnect()
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    )
    observer.observe(node)

    const fallback = window.setTimeout(() => node.classList.add('is-in'), 2500)
    return () => {
      observer.disconnect()
      window.clearTimeout(fallback)
    }
  }, [reduced])

  const classes = ['reveal', fade ? 'reveal--fade' : '', className].filter(Boolean).join(' ')

  return (
    <Tag
      ref={ref as never}
      id={id}
      className={classes}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  )
}
