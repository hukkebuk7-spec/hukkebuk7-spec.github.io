import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useMotion } from '../lib/motion-context'
import { loadScroll } from '../lib/scroll'

const patterns = [
  { n: '01', title: 'Fade & rise', tag: 'Entrance' },
  { n: '02', title: 'Masked headline', tag: 'Entrance' },
  { n: '03', title: 'Underline that follows', tag: 'Interaction' },
  { n: '04', title: 'Magnetic button', tag: 'Interaction' },
  { n: '05', title: 'Disclosure', tag: 'Components' },
  { n: '06', title: 'Tabs with a sliding indicator', tag: 'Components' },
  { n: '07', title: 'Toast with a way out', tag: 'Feedback' },
  { n: '08', title: 'Skeleton with reserved space', tag: 'Feedback' },
  { n: '09', title: 'Count up', tag: 'Data' },
  { n: '10', title: 'Before / after split', tag: 'Media' },
  { n: '11', title: 'Dialog that returns focus', tag: 'Components' },
  { n: '12', title: 'Parallax without the jank', tag: 'Scroll' },
]

export function PatternReel() {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLSpanElement>(null)
  const { reduced } = useMotion()

  useEffect(() => {
    const section = sectionRef.current
    const track = trackRef.current
    if (!section || !track || reduced) return

    let cancelled = false
    let teardown: (() => void) | undefined

    loadScroll()
      .then(({ gsap, ScrollTrigger }) => {
        if (cancelled) return
        const media = gsap.matchMedia()

        media.add('(min-width: 900px)', () => {
          const distance = () =>
            Math.max(0, track.scrollWidth - document.documentElement.clientWidth)

          const tween = gsap.fromTo(
            track,
            { x: 0 },
            {
              x: () => -distance(),
              ease: 'none',
              scrollTrigger: {
                trigger: section,
                start: 'top top',
                end: 'bottom bottom',
                scrub: 0.7,
                invalidateOnRefresh: true,
                onUpdate: (self: { progress: number }) => {
                  if (progressRef.current) {
                    progressRef.current.style.transform = `scaleX(${self.progress})`
                  }
                },
              },
            },
          )

          document.fonts?.ready.then(() => {
            if (!cancelled) ScrollTrigger.refresh()
          })

          return () => {
            tween.scrollTrigger?.kill()
            tween.kill()
            gsap.set(track, { x: 0 })
          }
        })

        teardown = () => media.revert()
      })
      .catch(() => {
        /* The register falls back to the static grid. */
      })

    return () => {
      cancelled = true
      teardown?.()
    }
  }, [reduced])

  return (
    <section
      ref={sectionRef}
      className="reel"
      data-active={reduced ? 'false' : 'true'}
      aria-labelledby="reel-title"
    >
      <div className="reel__sticky">
        <div className="wrap reel__head">
          <div>
            <p className="mono reel__label">04 / Register</p>
            <h2 id="reel-title" className="reel__title">
              The whole vocabulary, <em className="serif">in motion.</em>
            </h2>
          </div>
          <p className="mono reel__hint">
            <span aria-hidden="true">Scroll to travel</span>
            <Link to="/library" viewTransition>
              Open the library
            </Link>
          </p>
        </div>

        <div className="reel__viewport">
          <div ref={trackRef} className="reel__track" aria-hidden="true">
            {patterns.map((pattern, index) => (
              <div
                key={pattern.n}
                className={index % 4 === 2 ? 'reel-card reel-card--acid' : 'reel-card'}
              >
                <div className="reel-card__top mono">
                  <span>{pattern.n}</span>
                  <span>{pattern.tag}</span>
                </div>
                <h3 className="reel-card__title">{pattern.title}</h3>
                <span className="reel-card__glyph">
                  <span />
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="wrap reel__foot">
          <span className="mono">Twelve patterns / one register</span>
          <div className="reel__progress" aria-hidden="true">
            <span ref={progressRef} />
          </div>
        </div>
      </div>
    </section>
  )
}
