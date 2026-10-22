import { useEffect, useRef, useState } from 'react'
import { Icon } from '../components/Icons'
import { useMotion } from '../lib/motion-context'

/* 01 — Fade & rise */
export function FadeRiseDemo() {
  const [run, setRun] = useState(0)
  const { reduced } = useMotion()
  return (
    <div className="demo demo-fade">
      <div key={run} className={reduced ? 'fade-demo__card is-still' : 'fade-demo__card'}>
        <span className="mono">Field note 014</span>
        <strong>Arrive with intent.</strong>
        <span className="fade-demo__line" />
        <span className="fade-demo__line fade-demo__line--short" />
      </div>
      <button type="button" className="demo-btn" onClick={() => setRun((value) => value + 1)}>
        <Icon name="reset" size={13} /> Replay
      </button>
    </div>
  )
}

/* 02 — Masked headline */
export function MaskRevealDemo() {
  const [run, setRun] = useState(0)
  const { reduced } = useMotion()
  return (
    <div className="demo demo-mask">
      <div className="mask-demo__headline" key={run}>
        <span className={reduced ? 'mask-line is-still' : 'mask-line'}>
          <span>Motion with</span>
        </span>
        <span className={reduced ? 'mask-line is-still' : 'mask-line'}>
          <span><em className="serif">grammar.</em></span>
        </span>
      </div>
      <button type="button" className="demo-btn" onClick={() => setRun((value) => value + 1)}>
        <Icon name="reset" size={13} /> Reveal
      </button>
    </div>
  )
}

/* 03 — Underline navigation */
export function UnderlineNavDemo() {
  const [current, setCurrent] = useState('Patterns')
  const items = ['Index', 'Patterns', 'About']
  return (
    <div className="demo demo-underline">
      <nav aria-label="Underline demo">
        <ul className="underline-nav">
          {items.map((item) => (
            <li key={item}>
              <button
                type="button"
                className={current === item ? 'is-current' : ''}
                aria-current={current === item ? 'page' : undefined}
                onClick={() => setCurrent(item)}
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <p className="demo-caption mono">Focus or hover to draw the rule</p>
    </div>
  )
}

/* 04 — Magnetic button */
export function MagneticDemo() {
  const [count, setCount] = useState(0)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { reduced } = useMotion()

  const move = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (reduced || event.pointerType === 'touch') return
    const button = buttonRef.current
    if (!button) return
    const rect = button.getBoundingClientRect()
    const x = (event.clientX - rect.left - rect.width / 2) * 0.18
    const y = (event.clientY - rect.top - rect.height / 2) * 0.24
    button.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`
  }

  const reset = () => {
    if (buttonRef.current) buttonRef.current.style.transform = ''
  }

  return (
    <div className="demo demo-magnetic">
      <button
        ref={buttonRef}
        type="button"
        className="magnetic-btn"
        onPointerMove={move}
        onPointerLeave={reset}
        onBlur={reset}
        onClick={() => setCount((value) => value + 1)}
      >
        <span>Press me</span>
        <Icon name="arrow" size={17} />
      </button>
      <p className="demo-caption mono" aria-live="polite">
        {count > 0 ? `Pressed ×${count} — keyboard works normally` : 'Pointer pulls the button toward you'}
      </p>
    </div>
  )
}

/* 05 — Disclosure */
export function DisclosureDemo() {
  const [open, setOpen] = useState(false)
  return (
    <div className="demo demo-disclosure">
      <div className={open ? 'disclosure is-open' : 'disclosure'}>
        <button
          type="button"
          className="disclosure__trigger"
          aria-expanded={open}
          aria-controls="demo-disclosure-panel"
          onClick={() => setOpen((value) => !value)}
        >
          <span>What counts as motion?</span>
          <span className="disclosure__icon" aria-hidden="true">{open ? '−' : '+'}</span>
        </button>
        <div className="disclosure__panel" id="demo-disclosure-panel" role="region" aria-label="What counts as motion?">
          <div>
            <p>
              Duration, easing, choreography, and the instant state changes that happen without a
              frame. If it changes how the interface feels in time, it counts.
            </p>
          </div>
        </div>
      </div>
      <p className="demo-caption mono">Native disclosure semantics + height transition</p>
    </div>
  )
}

/* 06 — Tabs */
const tabData = [
  { id: 'motion', label: 'Motion', copy: 'Travel is the expensive part. Keep distances modest and durations proportional.' },
  { id: 'layout', label: 'Layout', copy: 'Animate transforms and opacity where possible; avoid animating layout properties.' },
  { id: 'colour', label: 'Colour', copy: 'Cross-fades between states should be quick. Do not make people wait for a tint.' },
]

export function TabsDemo() {
  const [active, setActive] = useState(0)
  const refs = useRef<Array<HTMLButtonElement | null>>([])

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number
    if (event.key === 'ArrowRight') next = (index + 1) % tabData.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabData.length) % tabData.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = tabData.length - 1
    else return
    event.preventDefault()
    setActive(next)
    refs.current[next]?.focus()
  }

  return (
    <div className="demo demo-tabs">
      <div className="tabs" style={{ '--tab-count': tabData.length } as React.CSSProperties}>
        <div className="tabs__list" role="tablist" aria-label="Motion topics">
          {tabData.map((tab, index) => (
            <button
              key={tab.id}
              ref={(node) => { refs.current[index] = node }}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={active === index}
              aria-controls={`panel-${tab.id}`}
              tabIndex={active === index ? 0 : -1}
              onClick={() => setActive(index)}
              onKeyDown={(event) => onKeyDown(event, index)}
            >
              {tab.label}
            </button>
          ))}
          <span className="tabs__indicator" style={{ transform: `translateX(${active * 100}%)` }} aria-hidden="true" />
        </div>
        {tabData.map((tab, index) => (
          <div
            key={tab.id}
            role="tabpanel"
            id={`panel-${tab.id}`}
            aria-labelledby={`tab-${tab.id}`}
            hidden={active !== index}
            tabIndex={0}
            className="tabs__panel"
          >
            <p>{tab.copy}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* 07 — Toast */
export function ToastDemo() {
  const [visible, setVisible] = useState(false)
  const [run, setRun] = useState(0)
  const timeout = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timeout.current), [])

  const show = () => {
    window.clearTimeout(timeout.current)
    setRun((value) => value + 1)
    setVisible(true)
    timeout.current = window.setTimeout(() => setVisible(false), 4200)
  }

  return (
    <div className="demo demo-toast">
      <button type="button" className="btn btn--sm" onClick={show}>
        Show toast
      </button>
      <p className="demo-caption mono">Role status · auto-dismiss · manual close</p>
      {visible && (
        <div className="toast" key={run} role="status">
          <span className="toast__dot" aria-hidden="true" />
          <span>Demo toast — nothing was saved.</span>
          <button
            type="button"
            className="toast__close"
            aria-label="Dismiss notification"
            onClick={() => {
              window.clearTimeout(timeout.current)
              setVisible(false)
            }}
          >
            <Icon name="close" size={14} />
          </button>
          <span className="toast__progress" aria-hidden="true" />
        </div>
      )}
    </div>
  )
}

/* 08 — Skeleton */
export function SkeletonDemo() {
  const [state, setState] = useState<'idle' | 'loading' | 'ready'>('idle')
  const timeout = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timeout.current), [])

  const load = () => {
    window.clearTimeout(timeout.current)
    setState('loading')
    timeout.current = window.setTimeout(() => setState('ready'), 950)
  }

  return (
    <div className="demo demo-skeleton">
      <div className="skeleton-card" aria-busy={state === 'loading'}>
        {state === 'ready' ? (
          <>
            <span className="mono">Loaded / 320 ms</span>
            <strong>Permission to move</strong>
            <p>A loaded state should reserve its final space before the content arrives.</p>
          </>
        ) : (
          <>
            <span className={state === 'loading' ? 'skeleton skeleton--line skeleton--short is-loading' : 'skeleton skeleton--line skeleton--short'} />
            <span className={state === 'loading' ? 'skeleton skeleton--line skeleton--title is-loading' : 'skeleton skeleton--line skeleton--title'} />
            <span className={state === 'loading' ? 'skeleton skeleton--line is-loading' : 'skeleton skeleton--line'} />
            <span className={state === 'loading' ? 'skeleton skeleton--line is-loading' : 'skeleton skeleton--line'} />
          </>
        )}
      </div>
      <div className="demo-row">
        <button type="button" className="demo-btn" onClick={load} disabled={state === 'loading'}>
          <Icon name={state === 'ready' ? 'reset' : 'play'} size={13} />
          {state === 'ready' ? 'Reload' : 'Simulate load'}
        </button>
        <span className="demo-caption mono" aria-live="polite">
          {state === 'loading' ? 'Loading…' : state === 'ready' ? 'Content ready' : 'Idle'}
        </span>
      </div>
    </div>
  )
}

/* 09 — Count up */
export function CounterDemo() {
  const [value, setValue] = useState(0)
  const frame = useRef(0)
  const { reduced } = useMotion()

  const run = () => {
    window.cancelAnimationFrame(frame.current)
    if (reduced) {
      setValue(1284)
      return
    }
    const start = performance.now()
    const duration = 1100
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(1284 * eased))
      if (progress < 1) frame.current = window.requestAnimationFrame(tick)
    }
    frame.current = window.requestAnimationFrame(tick)
  }

  useEffect(() => () => window.cancelAnimationFrame(frame.current), [])

  return (
    <div className="demo demo-counter">
      <div className="counter">
        <span className="mono">Illustrative metric</span>
        <strong>{value.toLocaleString('en-US')}</strong>
        <span className="mono">sessions / week</span>
      </div>
      <button type="button" className="demo-btn" onClick={run}>
        <Icon name="play" size={13} /> Count up
      </button>
      <p className="demo-caption mono">Numbers are invented for the demo</p>
    </div>
  )
}

/* 10 — Before / after */
export function CompareDemo() {
  const [position, setPosition] = useState(52)
  return (
    <div className="demo demo-compare">
      <div className="compare" style={{ '--split': `${position}%` } as React.CSSProperties}>
        <div className="compare__panel compare__panel--before">
          <span className="mono">Before</span>
          <strong>Linear</strong>
          <span className="compare__shape compare__shape--before" />
        </div>
        <div className="compare__panel compare__panel--after" aria-hidden="true">
          <span className="mono">After</span>
          <strong>Eased</strong>
          <span className="compare__shape compare__shape--after" />
        </div>
        <span className="compare__handle" aria-hidden="true" />
      </div>
      <label className="compare__control">
        <span className="mono">Split</span>
        <input
          type="range"
          min="0"
          max="100"
          value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
        />
      </label>
    </div>
  )
}

/* 11 — Dialog */
export function DialogDemo() {
  const dialogRef = useRef<HTMLDialogElement>(null)

  const open = () => dialogRef.current?.showModal()
  const close = () => dialogRef.current?.close()

  return (
    <div className="demo demo-dialog">
      <button type="button" className="btn btn--sm" onClick={open}>
        Open dialog
      </button>
      <p className="demo-caption mono">Native dialog · escape closes · focus returns</p>
      <dialog
        ref={dialogRef}
        className="demo-dialog__dialog"
        aria-labelledby="dialog-title"
        onClick={(event) => {
          if (event.target === dialogRef.current) close()
        }}
      >
        <div className="demo-dialog__inner">
          <span className="mono">A modal with a job</span>
          <h3 id="dialog-title">Interrupt only when it matters.</h3>
          <p>
            A dialog takes over the screen, the keyboard, and the user&apos;s attention. Use it for a
            decision or a focused task, never for decoration.
          </p>
          <div className="demo-dialog__actions">
            <button type="button" className="btn btn--sm btn--signal" onClick={close}>
              Close
            </button>
            <button type="button" className="text-link" onClick={close}>
              Return to page
            </button>
          </div>
        </div>
      </dialog>
    </div>
  )
}

/* 12 — Parallax card */
export function ParallaxDemo() {
  const stageRef = useRef<HTMLDivElement>(null)
  const { reduced } = useMotion()

  useEffect(() => {
    const stage = stageRef.current
    if (!stage || reduced) return
    let active = false
    let frame = 0
    const update = () => {
      frame = 0
      if (!active) return
      const rect = stage.getBoundingClientRect()
      const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height)
      stage.style.setProperty('--shift', String(Math.min(1, Math.max(0, progress))))
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    const observer = new IntersectionObserver((entries) => {
      active = entries[0]?.isIntersecting ?? false
      if (active) update()
    })
    observer.observe(stage)
    window.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [reduced])

  return (
    <div className="demo demo-parallax">
      <div className="parallax-stage" ref={stageRef} aria-hidden="true">
        <span className="parallax-layer parallax-layer--back">01</span>
        <span className="parallax-layer parallax-layer--mid" />
        <span className="parallax-layer parallax-layer--front">
          <span className="mono">Depth</span>
          <strong>without noise</strong>
        </span>
      </div>
      <p className="demo-caption mono">Scroll the page to see the layers shift</p>
    </div>
  )
}
