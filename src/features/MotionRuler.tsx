import { useEffect, useRef } from 'react'
import { useMotion } from '../lib/motion-context'
import { loadScroll } from '../lib/scroll'

const marks = [
  { ms: 0, label: '0' },
  { ms: 80, label: '80' },
  { ms: 160, label: '160' },
  { ms: 280, label: '280' },
  { ms: 560, label: '560' },
  { ms: 800, label: '800' },
]

const START = 60
const SPAN = 620

export function MotionRuler() {
  const figureRef = useRef<HTMLElement>(null)
  const runnerRef = useRef<SVGGElement>(null)
  const readoutRef = useRef<SVGTextElement>(null)
  const { reduced } = useMotion()

  useEffect(() => {
    const figure = figureRef.current
    const runner = runnerRef.current
    if (!figure || !runner || reduced) return

    let cancelled = false
    let teardown: (() => void) | undefined

    loadScroll()
      .then(({ gsap }) => {
        if (cancelled) return
        const media = gsap.matchMedia()
        media.add('(min-width: 700px)', () => {
          const tween = gsap.fromTo(
            runner,
            { x: 0 },
            {
              x: SPAN,
              ease: 'none',
              scrollTrigger: {
                trigger: figure,
                start: 'top 85%',
                end: 'bottom 35%',
                scrub: 0.5,
              },
              onUpdate: () => {
                const progress = Number(gsap.getProperty(runner, 'x')) / SPAN
                const ms = Math.round(progress * 800)
                if (readoutRef.current) readoutRef.current.textContent = `${ms} ms`
              },
            },
          )
          return () => {
            tween.scrollTrigger?.kill()
            tween.kill()
            gsap.set(runner, { x: 217 })
            if (readoutRef.current) readoutRef.current.textContent = '280 ms'
          }
        })
        teardown = () => media.revert()
      })
      .catch(() => {
        /* The ruler keeps its static 280 ms mark. */
      })

    return () => {
      cancelled = true
      teardown?.()
    }
  }, [reduced])

  const position = (ms: number) => START + (ms / 800) * SPAN

  return (
    <figure ref={figureRef} className="motion-ruler">
      <div className="motion-ruler__head">
        <span className="mono">The useful window</span>
        <span className="mono" aria-hidden="true">0 — 800 ms</span>
      </div>
      <svg
        className="motion-ruler__svg"
        viewBox="0 0 740 190"
        role="img"
        aria-labelledby="ruler-title ruler-desc"
      >
        <title id="ruler-title">Interface motion duration ruler</title>
        <desc id="ruler-desc">
          A scale from zero to eight hundred milliseconds. Most interface motion lands between one
          hundred sixty and three hundred twenty milliseconds, with exits running faster than
          entrances.
        </desc>

        <rect x={position(160)} y="58" width={position(280) - position(160)} height="74" className="motion-ruler__zone" />
        <line x1={START} y1="126" x2={START + SPAN} y2="126" className="motion-ruler__baseline" />

        {marks.map((mark) => (
          <g key={mark.ms} className={mark.ms === 160 || mark.ms === 280 ? 'motion-ruler__mark is-key' : 'motion-ruler__mark'}>
            <line x1={position(mark.ms)} y1="118" x2={position(mark.ms)} y2="136" />
            <text x={position(mark.ms)} y="158" textAnchor="middle">
              {mark.label}
            </text>
          </g>
        ))}

        <text x={START} y="44" className="motion-ruler__note">
          Most interaction
        </text>
        <text x={position(560)} y="44" className="motion-ruler__note">
          Larger transitions
        </text>

        <g ref={runnerRef} transform={`translate(${position(280) - START} 0)`} className="motion-ruler__runner">
          <line x1="0" y1="52" x2="0" y2="142" />
          <circle cx="0" cy="126" r="5" />
          <text ref={readoutRef} x="0" y="176" textAnchor="middle">
            280 ms
          </text>
        </g>
      </svg>
      <figcaption className="motion-ruler__caption">
        Duration is a function of distance and consequence. Short, local changes sit near the low
        end. A rare, spatial transition can spend more. Exits should usually finish sooner than
        entrances.
      </figcaption>
    </figure>
  )
}
