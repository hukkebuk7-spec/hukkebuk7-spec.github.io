import { Fragment, useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { useMotion } from '../lib/motion-context'

export type HeadingSegment = {
  text: string
  accent?: boolean
}

type SplitHeadingProps = {
  as?: 'h1' | 'h2'
  segments: HeadingSegment[]
  className?: string
  id?: string
}

export function SplitHeading({ as: Tag = 'h1', segments, className = '', id }: SplitHeadingProps) {
  const ref = useRef<HTMLHeadingElement>(null)
  const { reduced } = useMotion()

  useEffect(() => {
    const node = ref.current
    if (!node) return
    node.classList.remove('is-armed', 'is-in')

    if (reduced || !('IntersectionObserver' in window)) {
      node.classList.add('is-in')
      return
    }

    node.classList.add('is-armed')
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          node.classList.add('is-in')
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.1 },
    )
    observer.observe(node)

    return () => observer.disconnect()
  }, [reduced])

  let wordIndex = 0

  return (
    <Tag ref={ref} id={id} className={['split-heading', className].filter(Boolean).join(' ')}>
      {segments.map((segment, segmentIndex) => {
        const words = segment.text.split(/\s+/).filter(Boolean)
        const content = words.map((word, wordOnIndex) => {
          const index = wordIndex++
          return (
            <Fragment key={`${segmentIndex}-${wordOnIndex}`}>
              <span
                className="split-word"
                style={{ '--i': index } as CSSProperties}
              >
                <span className="split-word__inner">{word}</span>
              </span>{' '}
            </Fragment>
          )
        })

        return (
          <span
            key={segmentIndex}
            className={segment.accent ? 'split-segment split-segment--accent' : 'split-segment'}
          >
            {segment.accent ? <em className="serif">{content}</em> : content}
          </span>
        )
      })}
    </Tag>
  )
}
