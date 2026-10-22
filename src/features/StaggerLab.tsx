import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Icon } from '../components/Icons'
import { useCopy } from '../lib/useCopy'
import { useMotion } from '../lib/motion-context'

const easings = ['power2.out', 'power3.out', 'power4.out', 'back.out(1.7)', 'circ.out'] as const
type Ease = (typeof easings)[number]

export function StaggerLab() {
  const [count, setCount] = useState(12)
  const [stagger, setStagger] = useState(50)
  const [duration, setDuration] = useState(600)
  const [distance, setDistance] = useState(24)
  const [ease, setEase] = useState<Ease>('power3.out')
  const [status, setStatus] = useState('Ready. Run the sequence to preview.')
  const gridRef = useRef<HTMLDivElement>(null)
  const tweenRef = useRef<gsap.core.Tween | null>(null)
  const { reduced } = useMotion()
  const { copied, copy } = useCopy()

  const code = `/* TEMPO — stagger sequence */
gsap.fromTo(".item", {
  y: ${distance},
  opacity: 0
}, {
  y: 0,
  opacity: 1,
  duration: ${(duration / 1000).toFixed(2)},
  ease: "${ease}",
  stagger: ${(stagger / 1000).toFixed(2)}
});

/* With reduced motion, set the final state instead:
   gsap.set(".item", { y: 0, opacity: 1 }); */`

  const run = () => {
    const grid = gridRef.current
    if (!grid) return
    const items = grid.querySelectorAll<HTMLElement>('.stagger-item')
    tweenRef.current?.kill()

    if (reduced) {
      gsap.set(items, { y: 0, opacity: 1 })
      setStatus('Reduced motion is on. The final state is shown without movement.')
      return
    }

    setStatus(`Running ${count} items · ${(duration / 1000).toFixed(2)}s each · ${stagger} ms apart.`)
    tweenRef.current = gsap.fromTo(
      items,
      { y: distance, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: duration / 1000,
        ease,
        stagger: stagger / 1000,
        overwrite: true,
        onComplete: () => setStatus('Sequence complete. Adjust the values and run it again.'),
      },
    )
  }

  useEffect(() => {
    return () => {
      tweenRef.current?.kill()
    }
  }, [])

  useEffect(() => {
    if (!reduced) return
    const items = gridRef.current?.querySelectorAll<HTMLElement>('.stagger-item')
    if (items) gsap.set(items, { y: 0, opacity: 1 })
  }, [reduced])

  return (
    <div className="stagger-lab">
      <div className="stagger-lab__controls">
        <div className="stagger-sliders">
          <div className="field">
            <label className="field__label" htmlFor="stagger-count">
              Items
              <span className="field__value">{count}</span>
            </label>
            <input
              id="stagger-count"
              type="range"
              min="4"
              max="24"
              step="1"
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="stagger-gap">
              Stagger
              <span className="field__value">{stagger} ms</span>
            </label>
            <input
              id="stagger-gap"
              type="range"
              min="0"
              max="160"
              step="5"
              value={stagger}
              onChange={(event) => setStagger(Number(event.target.value))}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="stagger-duration">
              Duration
              <span className="field__value">{duration} ms</span>
            </label>
            <input
              id="stagger-duration"
              type="range"
              min="200"
              max="1200"
              step="20"
              value={duration}
              onChange={(event) => setDuration(Number(event.target.value))}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="stagger-distance">
              Distance
              <span className="field__value">{distance} px</span>
            </label>
            <input
              id="stagger-distance"
              type="range"
              min="0"
              max="64"
              step="2"
              value={distance}
              onChange={(event) => setDistance(Number(event.target.value))}
            />
          </div>
        </div>

        <fieldset className="lab-fieldset">
          <legend className="mono">Ease</legend>
          <div className="stagger-eases">
            {easings.map((option) => (
              <button
                key={option}
                type="button"
                className="chip"
                aria-pressed={ease === option}
                onClick={() => setEase(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="lab-control-actions">
          <button type="button" className="btn" onClick={run}>
            <Icon name="play" size={14} /> Run sequence
          </button>
          <span className="mono lab-settle">
            Total ≈ {Math.round(duration + stagger * Math.max(0, count - 1))} ms
          </span>
        </div>
        <p className="lab-note" aria-live="polite">{status}</p>
      </div>

      <div className="stagger-lab__stage">
        <div className="stagger-stage">
          <div className="stagger-stage__top mono">
            <span>Choreography</span>
            <span>{count} × {stagger} ms</span>
          </div>
          <div
            className="stagger-grid"
            ref={gridRef}
            style={{ gridTemplateColumns: `repeat(${Math.min(6, Math.ceil(Math.sqrt(count)))}, minmax(0, 1fr))` }}
            aria-hidden="true"
          >
            {Array.from({ length: count }, (_, index) => (
              <span key={index} className="stagger-item">
                <span className="mono">{String(index + 1).padStart(2, '0')}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="code-block">
          <div className="code-block__bar">
            <span>GSAP / sequence</span>
            <button type="button" className="copy-btn" onClick={() => copy(code)}>
              <Icon name={copied ? 'check' : 'copy'} size={13} />
              {copied ? 'Copied' : 'Copy JS'}
            </button>
          </div>
          <pre tabIndex={0} aria-label="Code sample"><code>{code}</code></pre>
        </div>
      </div>
    </div>
  )
}
