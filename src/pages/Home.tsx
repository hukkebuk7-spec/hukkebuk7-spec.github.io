import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageMeta } from '../components/PageMeta'
import { Reveal } from '../components/Reveal'
import { SplitHeading } from '../components/SplitHeading'
import { Icon } from '../components/Icons'
import { PatternReel } from '../features/PatternReel'
import { useMotion } from '../lib/motion-context'
import { supportsWebgl } from '../lib/webgl'
import { loadScroll } from '../lib/scroll'
import { openJarvis } from '../lib/jarvis-events'

const SignalField3D = lazy(() => import('../features/SignalField3D'))

const tickerItems = [
  'Ease with intent',
  '180–320 ms',
  'Respect reduced motion',
  'Test on a phone',
  'Never scroll-jack',
  'Measure, then cut',
]

type HeroSignalProps = {
  paused: boolean
  show3d: boolean
  ready: boolean
  onReady: () => void
  onFail: () => void
}

function HeroSignal({ paused, show3d, ready, onReady, onFail }: HeroSignalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { reduced } = useMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    const pointer = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5, strength: 0, targetStrength: 0 }
    let width = 0
    let height = 0
    let frame = 0
    let visible = true
    let time = 0
    let last = performance.now()

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = Math.max(1, rect.width)
      height = Math.max(1, rect.height)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      render(performance.now(), true)
    }

    const render = (now: number, still = false) => {
      const delta = Math.min(48, now - last)
      last = now
      if (!still) time += delta * 0.001

      pointer.x += (pointer.targetX - pointer.x) * 0.08
      pointer.y += (pointer.targetY - pointer.y) * 0.08
      pointer.strength += (pointer.targetStrength - pointer.strength) * 0.06

      context.clearRect(0, 0, width, height)
      const center = height * 0.52
      const step = width < 420 ? 5 : 7
      const count = Math.ceil(width / step)

      context.strokeStyle = 'rgba(242, 239, 230, 0.12)'
      context.lineWidth = 1
      context.beginPath()
      context.moveTo(0, center)
      context.lineTo(width, center)
      context.stroke()

      for (let index = 0; index < count; index += 1) {
        const x = index * step + step / 2
        const normalized = x / width
        const wave =
          Math.sin(normalized * 8.4 + time * 1.1) * 0.34 +
          Math.sin(normalized * 19.2 - time * 0.64) * 0.16 +
          Math.sin(normalized * 3.1 + time * 0.36) * 0.2
        const distance = Math.abs(normalized - pointer.x)
        const influence = Math.max(0, 1 - distance * 3.4) * pointer.strength
        const vertical = (pointer.y - 0.5) * 2
        const amplitude = height * (0.16 + wave * 0.42 + influence * (0.22 + vertical * 0.18))
        const barHeight = Math.max(1.5, Math.abs(amplitude))
        const accent = index % 17 === 0
        context.fillStyle = accent ? '#e5441c' : index % 3 === 0 ? '#f2efe6' : '#ddf04a'
        context.globalAlpha = 0.35 + Math.min(0.65, barHeight / (height * 0.6))
        context.fillRect(x, center - barHeight / 2, step - 2, barHeight)
      }
      context.globalAlpha = 1

      const markerX = pointer.x * width
      context.strokeStyle = 'rgba(229, 68, 28, 0.9)'
      context.beginPath()
      context.moveTo(markerX, 0)
      context.lineTo(markerX, height)
      context.stroke()
    }

    const loop = (now: number) => {
      if (visible && document.visibilityState === 'visible') render(now)
      frame = window.requestAnimationFrame(loop)
    }

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer.targetX = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
      pointer.targetY = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height))
      pointer.targetStrength = 1
    }
    const onPointerLeave = () => {
      pointer.targetStrength = 0
      pointer.targetX = 0.5
      pointer.targetY = 0.5
    }
    const onVisibility = () => {
      last = performance.now()
    }

    const observer = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true
    })
    observer.observe(canvas)
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    resize()

    if (!reduced && !paused) {
      canvas.addEventListener('pointermove', onPointerMove)
      canvas.addEventListener('pointerleave', onPointerLeave)
      document.addEventListener('visibilitychange', onVisibility)
      frame = window.requestAnimationFrame(loop)
    }

    return () => {
      observer.disconnect()
      resizeObserver.disconnect()
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerleave', onPointerLeave)
      document.removeEventListener('visibilitychange', onVisibility)
      window.cancelAnimationFrame(frame)
    }
  }, [paused, reduced])

  return (
    <figure className={ready ? 'signal is-3d' : 'signal'}>
      <figcaption className="signal__top mono">
        <span className="signal__live">
          <span className="signal__live-dot" aria-hidden="true" /> Live signal
        </span>
        <span>Ref. 01 / pointer</span>
      </figcaption>
      <div
        className="signal__canvas-wrap"
        role="img"
        aria-label="Decorative animated waveform field that responds to pointer movement"
      >
        <canvas ref={canvasRef} className="signal__canvas" aria-hidden="true" />
        {show3d && (
          <Suspense fallback={null}>
            <SignalField3D onReady={onReady} onFail={onFail} />
          </Suspense>
        )}
        <span className="signal__corner signal__corner--tl" aria-hidden="true">+</span>
        <span className="signal__corner signal__corner--tr" aria-hidden="true">+</span>
        <span className="signal__corner signal__corner--bl" aria-hidden="true">+</span>
        <span className="signal__corner signal__corner--br" aria-hidden="true">+</span>
      </div>
      <div className="signal__readout">
        <span className="mono">Field / pointer</span>
        <span className="mono">Easing / organic</span>
        <span className="mono">Frame / {ready ? 'WebGL' : '60'}</span>
      </div>
      <div className="signal__hint mono">Move the pointer across the field</div>
    </figure>
  )
}

function Ticker() {
  const row = (ariaHidden: boolean) => (
    <div className="ticker__group" aria-hidden={ariaHidden || undefined}>
      {tickerItems.map((item) => (
        <span key={item} className="ticker__item">
          {item}
          <span className="ticker__star" aria-hidden="true">◆</span>
        </span>
      ))}
    </div>
  )

  return (
    <div className="ticker" aria-label="Principles in brief">
      <div className="ticker__track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  )
}

function PrincipleDemo({ kind, label }: { kind: 'purpose' | 'distance' | 'easing' | 'continuity' | 'control'; label: string }) {
  const [paused, setPaused] = useState(false)
  const { reduced } = useMotion()

  if (kind === 'purpose') {
    return (
      <div className="p-demo p-demo--purpose" aria-hidden="true">
        <span className="p-demo__caption mono">{label}</span>
        <div className="purpose-pulse">
          <span className="purpose-pulse__ring" />
          <span className="purpose-pulse__ring" />
          <span className="purpose-pulse__ring" />
          <span className="purpose-pulse__core" />
        </div>
      </div>
    )
  }

  if (kind === 'distance') {
    return (
      <div className="p-demo" aria-hidden="true">
        <span className="p-demo__caption mono">{label}</span>
        <div className="distance-row">
          <span className="distance-label mono">near / 160</span>
          <span className="distance-track"><span className="distance-bar distance-bar--near" /></span>
        </div>
        <div className="distance-row">
          <span className="distance-label mono">far / 520</span>
          <span className="distance-track"><span className="distance-bar distance-bar--far" /></span>
        </div>
      </div>
    )
  }

  if (kind === 'easing') {
    return (
      <div className="p-demo" aria-hidden="true">
        <span className="p-demo__caption mono">{label}</span>
        <svg className="ease-demo" viewBox="0 0 180 92" fill="none">
          <path d="M10 82H170M10 82V10" stroke="currentColor" strokeOpacity="0.25" />
          <path d="M10 82C54 82 58 18 170 18" stroke="currentColor" strokeWidth="1.5" />
          {reduced ? (
            <circle cx="170" cy="18" r="4" fill="var(--signal)" />
          ) : (
            <circle className="ease-demo__dot" r="4" fill="var(--signal)">
              <animateMotion
                dur="2.8s"
                repeatCount="indefinite"
                path="M10 82C54 82 58 18 170 18"
                calcMode="spline"
                keySplines="0.16 1 0.3 1"
                keyTimes="0;1"
              />
            </circle>
          )}
        </svg>
      </div>
    )
  }

  if (kind === 'continuity') {
    return (
      <div className="p-demo" aria-hidden="true">
        <span className="p-demo__caption mono">{label}</span>
        <div className="continuity">
          <span className="continuity__card">A</span>
          <span className="continuity__rail" />
          <span className="continuity__card continuity__card--b">B</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-demo p-demo--control">
      <span className="p-demo__caption mono">{label}</span>
      <div className={paused ? 'control-demo is-paused' : 'control-demo'}>
        <span className="control-demo__bar" />
        <span className="control-demo__bar control-demo__bar--2" />
      </div>
      <button
        type="button"
        className="chip control-demo__btn"
        aria-pressed={paused}
        onClick={() => setPaused((value) => !value)}
      >
        {paused ? 'Play demo' : 'Pause demo'}
      </button>
    </div>
  )
}

function HomeBudget() {
  const items = [
    'Every animation has a named purpose: orient, explain, or confirm.',
    'Duration matches distance. Short hops stay under 200 ms.',
    'Exits are quicker than entrances.',
    'Spatial movement is eased, never linear.',
    'A reduced-motion path exists and keeps the meaning.',
    'Decorative loops pause off-screen or on request.',
    'Tested on a mid-range phone, not only a laptop.',
    'No layout shift, no scroll-jacking, no keyboard traps.',
  ]
  const [checked, setChecked] = useState<boolean[]>(() => {
    try {
      const stored = window.localStorage.getItem('tempo:budget')
      if (stored) {
        const parsed: unknown = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length === items.length) {
          return parsed.map(Boolean)
        }
      }
    } catch {
      /* Ignore malformed or unavailable storage. */
    }
    return items.map(() => false)
  })

  const update = (index: number) => {
    setChecked((current) => {
      const next = current.map((value, itemIndex) => (itemIndex === index ? !value : value))
      try {
        window.localStorage.setItem('tempo:budget', JSON.stringify(next))
      } catch {
        /* The checklist still works for this session. */
      }
      return next
    })
  }

  const score = checked.filter(Boolean).length
  const verdict =
    score === items.length
      ? 'Ship it — then watch it on a slow phone.'
      : score >= 6
        ? 'Close. Resolve the open items before shipping.'
        : score >= 3
          ? 'Halfway there. The gaps are where jank lives.'
          : 'Early days. Start with purpose and reduced motion.'

  return (
    <section className="section budget" id="budget" aria-labelledby="budget-title">
      <div className="wrap">
        <div className="budget__grid">
          <div className="budget__intro">
            <div className="mono budget__label">05 / Motion budget</div>
            <h2 id="budget-title" className="budget__title">
              Every animation <em className="serif">spends</em> attention.
            </h2>
            <p>
              Motion has a cost: attention, battery, frame time. Treat it like a budget. Audit the
              interface before it ships, not after someone on a slow connection tells you it janks.
            </p>
            <div className="budget__score" aria-live="polite">
              <span className="budget__score-number">
                {String(score).padStart(2, '0')}
                <span className="budget__score-total">/ 08</span>
              </span>
              <div className="budget__score-copy">
                <span className="mono">Items cleared</span>
                <span>{verdict}</span>
              </div>
            </div>
            <div className="budget__meter" aria-hidden="true">
              <span style={{ width: `${(score / items.length) * 100}%` }} />
            </div>
            <p className="budget__note mono">Saved in this browser only. Nothing is sent anywhere.</p>
          </div>

          <div className="budget__checklist">
            <ul>
              {items.map((item, index) => (
                <li key={item}>
                  <label className="budget-item">
                    <input
                      type="checkbox"
                      checked={checked[index]}
                      onChange={() => update(index)}
                    />
                    <span className="budget-item__box" aria-hidden="true">
                      <Icon name="check" size={13} />
                    </span>
                    <span className="budget-item__index mono">{String(index + 1).padStart(2, '0')}</span>
                    <span className="budget-item__text">{item}</span>
                  </label>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="btn btn--sm"
              onClick={() => {
                const reset = items.map(() => false)
                setChecked(reset)
                try {
                  window.localStorage.removeItem('tempo:budget')
                } catch {
                  /* Nothing else to do. */
                }
              }}
            >
              <Icon name="reset" size={14} /> Reset audit
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export function Home() {
  const { reduced } = useMotion()
  const heroRef = useRef<HTMLElement>(null)
  const labPathRef = useRef<SVGPathElement>(null)
  const labRunnerRef = useRef<SVGCircleElement>(null)
  const [webgl, setWebgl] = useState(() => supportsWebgl())
  const [wide, setWide] = useState(() => window.matchMedia('(min-width: 900px)').matches)
  const [ready, setReady] = useState(false)
  const show3d = webgl && wide && !reduced
  const fieldReady = ready && show3d

  const onFieldReady = useCallback(() => setReady(true), [])
  const onFieldFail = useCallback(() => {
    setWebgl(false)
    setReady(false)
  }, [])

  useEffect(() => {
    const query = window.matchMedia('(min-width: 900px)')
    const onChange = (event: MediaQueryListEvent) => setWide(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (reduced) return
    const hero = heroRef.current
    if (!hero) return

    let cancelled = false
    let teardown: (() => void) | undefined

    loadScroll()
      .then(({ gsap }) => {
        if (cancelled) return
        const media = gsap.matchMedia()
        media.add('(min-width: 901px)', () => {
          const context = gsap.context(() => {
            const trigger = {
              trigger: hero,
              start: 'top top',
              end: 'bottom top',
              scrub: 0.7,
            }

            gsap.to('.hero__copy', {
              y: -34,
              ease: 'none',
              scrollTrigger: trigger,
            })
            gsap.to('.signal', {
              y: 48,
              ease: 'none',
              scrollTrigger: trigger,
            })
          }, hero)

          return () => context.revert()
        })
        teardown = () => media.revert()
      })
      .catch(() => {
        /* The hero stays readable without scroll-linked depth. */
      })

    return () => {
      cancelled = true
      teardown?.()
    }
  }, [reduced])

  useEffect(() => {
    if (reduced) return
    const path = labPathRef.current
    const runner = labRunnerRef.current
    if (!path || !runner) return

    const length = path.getTotalLength()
    let cancelled = false
    let teardown: (() => void) | undefined

    loadScroll()
      .then(({ gsap }) => {
        if (cancelled) return
        const media = gsap.matchMedia()
        media.add('(min-width: 701px)', () => {
          gsap.set(path, { strokeDasharray: length, strokeDashoffset: length })

          const trigger = {
            trigger: '.lab-teaser',
            start: 'top 78%',
            end: 'bottom 62%',
            scrub: 0.6,
          }

          const draw = gsap.to(path, {
            strokeDashoffset: 0,
            ease: 'none',
            scrollTrigger: trigger,
          })
          const travel = gsap.to(runner, {
            motionPath: { path, align: path, alignOrigin: [0.5, 0.5] },
            ease: 'none',
            scrollTrigger: { ...trigger },
          })

          return () => {
            draw.scrollTrigger?.kill()
            travel.scrollTrigger?.kill()
            draw.kill()
            travel.kill()
            gsap.set(path, { clearProps: 'strokeDasharray,strokeDashoffset' })
          }
        })
        teardown = () => media.revert()
      })
      .catch(() => {
        /* The curve stays fully drawn without scroll scrubbing. */
      })

    return () => {
      cancelled = true
      teardown?.()
    }
  }, [reduced])

  return (
    <>
      <PageMeta
        title="A field guide to interface motion"
        description={SITE_DESCRIPTION}
        path="/"
      />

      <section className="hero" ref={heroRef} aria-labelledby="hero-title">
        <div className="wrap hero__grid">
          <div className="hero__copy">
            <p className="hero__eyebrow mono">
              <span className="hero__eyebrow-dot" aria-hidden="true" />
              A field guide to interface motion · Edition 01
            </p>
            <h1 id="hero-title" className="hero__title">
              <span className="hero__line"><span>Motion is</span></span>
              <span className="hero__line"><span>a <em className="serif">language.</em></span></span>
            </h1>
            <p className="hero__lead">
              Durations, curves, and choreography. Learn the grammar that makes an interface feel
              alive — then learn when to leave it still.
            </p>
            <div className="hero__actions">
              <Link className="btn btn--signal" to="/lab">
                Enter the lab <Icon name="arrow" size={16} />
              </Link>
              <Link className="btn" to="/library">
                Browse patterns <Icon name="arrow" size={16} />
              </Link>
            </div>
            <div className="hero__meta mono">
              <span>Read time / 18 min</span>
              <span>Interactive / 5 tools</span>
              <span>No trackers</span>
            </div>
          </div>

          <div className="hero__signal-col">
            <HeroSignal
              paused={fieldReady}
              show3d={show3d}
              ready={fieldReady}
              onReady={onFieldReady}
              onFail={onFieldFail}
            />
            <p className="hero__signal-note mono">
              Fig. 01 — a field of frequencies. One pointer, no purpose beyond curiosity.
            </p>
          </div>
        </div>
      </section>

      <Ticker />

      <section className="contents section" aria-labelledby="contents-title">
        <div className="wrap">
          <div className="contents__head">
            <span className="mono">Index / 01—06</span>
            <h2 id="contents-title" className="contents__title">
              What is <em className="serif">inside</em>
            </h2>
            <p className="contents__note">
              Read it front to back, or jump straight to the tool you need. Every interactive piece
              runs in the browser.
            </p>
          </div>

          <ol className="contents__list">
            {[
              { n: '01', title: 'Principles', note: 'Five working rules, each with a live demonstration.', to: '#principles', meta: 'On this page' },
              { n: '02', title: 'Easing lab', note: 'Draw a curve. Feel it. Copy the CSS.', to: '/lab', meta: 'Interactive' },
              { n: '03', title: 'Spring lab', note: 'Tune stiffness and damping, then export a linear() curve.', to: '/lab#spring', meta: 'Interactive' },
              { n: '04', title: 'Pattern library', note: 'Twelve reusable patterns, with code you can lift.', to: '/library', meta: 'Reference' },
              { n: '05', title: 'Motion budget', note: 'An eight-point audit to run before you ship.', to: '#budget', meta: 'Checklist' },
              { n: '06', title: 'Colophon', note: 'The method, the type, the constraints behind this guide.', to: '/about', meta: 'About' },
            ].map((item) => {
              const content = (
                <>
                  <span className="contents__index mono">{item.n}</span>
                  <span className="contents__name">{item.title}</span>
                  <span className="contents__desc">{item.note}</span>
                  <span className="contents__meta mono">{item.meta}</span>
                  <span className="contents__arrow" aria-hidden="true"><Icon name="arrow-up-right" size={20} /></span>
                </>
              )
              return (
                <li key={item.n}>
                  {item.to.startsWith('#') ? (
                    <a href={item.to} className="contents__row">{content}</a>
                  ) : (
                    <Link to={item.to} className="contents__row">{content}</Link>
                  )}
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      <section className="section principles" id="principles" aria-labelledby="principles-title">
        <div className="wrap principles__grid">
          <aside className="principles__aside">
            <div className="mono principles__label">02 / Principles</div>
            <h2 id="principles-title" className="principles__title">
              Five rules.<br />
              <em className="serif">Then break them.</em>
            </h2>
            <p>
              These are not laws of physics. They are pressure-tested defaults — the places to start
              before you have a reason to do something else.
            </p>
            <div className="principles__stamp mono">
              <span>TEMPO</span>
              <span>Working defaults / 2026</span>
            </div>
          </aside>

          <div className="principles__list">
            {[
              {
                n: '01',
                title: 'Purpose before polish',
                copy: 'If an animation does not orient, explain, or confirm, cut it. Delight is a valid purpose, but it still has to earn its frame budget.',
                kind: 'purpose' as const,
                demo: 'Attention / earned',
              },
              {
                n: '02',
                title: 'Match the distance',
                copy: 'Short hops should be quick. Large journeys need more time. A 160 ms fade across 8 px feels deliberate; the same fade across 800 px feels broken.',
                kind: 'distance' as const,
                demo: 'Duration / distance',
              },
              {
                n: '03',
                title: 'Ease like physics',
                copy: 'Start quickly, settle slowly, avoid linear for spatial change. Curves imply weight. Overshoot only when the interface can absorb the bounce.',
                kind: 'easing' as const,
                demo: 'Curve / settle',
              },
              {
                n: '04',
                title: 'Preserve continuity',
                copy: 'An element should arrive from somewhere and leave to somewhere. Shared elements, matched positions, and uninterrupted focus preserve the map.',
                kind: 'continuity' as const,
                demo: 'Exit / re-enter',
              },
              {
                n: '05',
                title: 'Give control back',
                copy: 'Respect prefers-reduced-motion. Pause decorative loops. Never trap the scroll. The user is allowed to switch the show off.',
                kind: 'control' as const,
                demo: 'Control / user',
              },
            ].map((principle, index) => (
              <Reveal as="article" className="principle" key={principle.n} delay={index * 40}>
                <div className="principle__copy">
                  <div className="principle__top">
                    <span className="mono principle__index">{principle.n}</span>
                    <span className="tag">Default</span>
                  </div>
                  <h3 className="principle__title">{principle.title}</h3>
                  <p>{principle.copy}</p>
                </div>
                <PrincipleDemo kind={principle.kind} label={principle.demo} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="lab-teaser" aria-labelledby="lab-teaser-title">
        <div className="wrap lab-teaser__grid">
          <div className="lab-teaser__copy">
            <div className="mono lab-teaser__label">03 / The lab</div>
            <h2 id="lab-teaser-title" className="lab-teaser__title">
              Stop guessing <em className="serif">the curve.</em>
            </h2>
            <p>
              Drag the control points, feel the timing, then copy production-ready CSS. Three tools,
              one honest preview — including a reduced-motion check.
            </p>
            <div className="lab-teaser__actions">
              <Link className="btn btn--signal" to="/lab">
                Open the easing lab <Icon name="arrow" size={16} />
              </Link>
              <span className="mono lab-teaser__hint">Free · no account · runs locally</span>
            </div>
          </div>

          <div className="lab-teaser__preview" aria-hidden="true">
            <div className="ease-preview">
              <div className="ease-preview__head mono">
                <span>cubic-bezier</span>
                <span>0.16 · 1 · 0.3 · 1</span>
              </div>
              <svg viewBox="0 0 320 240" className="ease-preview__graphic" fill="none">
                <path d="M24 216H296M24 216V24" stroke="currentColor" strokeOpacity="0.25" />
                <path d="M24 96H296M24 156H296M104 24V216M184 24V216M264 24V216" stroke="currentColor" strokeOpacity="0.12" strokeDasharray="2 6" />
                <path ref={labPathRef} d="M24 216C77 216 82 26 296 26" stroke="var(--acid)" strokeWidth="2" />
                <circle cx="24" cy="216" r="4" fill="var(--paper)" />
                <circle cx="296" cy="26" r="4" fill="var(--signal)" />
                {!reduced && <circle ref={labRunnerRef} r="5" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.5" />}
                <path d="M24 216L77 216M296 26L296 26" stroke="currentColor" strokeOpacity="0.4" strokeDasharray="2 4" />
              </svg>
              <div className="ease-preview__track">
                <span className="ease-preview__dot" />
              </div>
              <div className="ease-preview__foot mono">
                <span>Duration / 640 ms</span>
                <span className="ease-preview__live">● playing</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section library-teaser" aria-labelledby="library-teaser-title">
        <div className="wrap">
          <div className="section-head">
            <span className="mono section-head__index">04 / The collection</span>
            <h2 id="library-teaser-title" className="section-head__title">
              Twelve patterns, <em className="serif">ready to use.</em>
            </h2>
            <p className="section-head__note">
              Tested defaults with live demos and copyable code. Filter by job, not by library.
            </p>
          </div>

          <div className="teaser-cards">
            {[
              { n: '01', title: 'Fade & rise', tag: 'Entrance', className: 'mini-fade' },
              { n: '02', title: 'Masked headline', tag: 'Typography', className: 'mini-mask' },
              { n: '03', title: 'Underline that follows', tag: 'Navigation', className: 'mini-underline' },
            ].map((card) => (
              <Link key={card.n} to="/library" className="teaser-card">
                <div className="teaser-card__top mono">
                  <span>{card.n}</span>
                  <span>{card.tag}</span>
                </div>
                <div className={`teaser-card__demo ${card.className}`} aria-hidden="true">
                  {card.className === 'mini-fade' && <span className="mini-fade__block" />}
                  {card.className === 'mini-mask' && (
                    <span className="mini-mask__line"><span>Motion</span></span>
                  )}
                  {card.className === 'mini-underline' && (
                    <span className="mini-underline__nav">
                      <span>Index</span><span className="is-current">Patterns</span><span>About</span>
                    </span>
                  )}
                </div>
                <div className="teaser-card__bottom">
                  <h3>{card.title}</h3>
                  <Icon name="arrow-up-right" size={18} />
                </div>
              </Link>
            ))}
          </div>

          <div className="library-teaser__foot">
            <Link className="btn" to="/library">
              Browse all twelve <Icon name="arrow" size={16} />
            </Link>
            <span className="mono">No install · no dependency · copy the intent</span>
          </div>
        </div>
      </section>

      <PatternReel />

      <HomeBudget />

      <section className="closing" aria-labelledby="closing-title">
        <div className="wrap closing__inner">
          <p className="mono closing__label">End note</p>
          <SplitHeading
            as="h2"
            id="closing-title"
            className="closing__title"
            segments={[
              { text: 'The best motion is' },
              { text: 'noticed', accent: true },
              { text: 'only when it is missing.' },
            ]}
          />
          <p className="closing__copy">
            Use it to explain what changed, where it came from, and what to do next. Then get out of
            the way.
          </p>
          <div className="closing__actions">
            <Link className="btn btn--signal" to="/lab">Try the lab <Icon name="arrow" size={16} /></Link>
            <button className="btn" type="button" onClick={openJarvis}>
              Ask Jarvis <Icon name="arrow" size={16} />
            </button>
            <Link className="text-link" to="/about">Read the method <Icon name="arrow" size={14} /></Link>
          </div>
        </div>
      </section>
    </>
  )
}

const SITE_DESCRIPTION =
  'TEMPO is a practical field guide to interface motion: five principles, a working easing and spring lab, twelve patterns, and an eight-point motion budget.'
