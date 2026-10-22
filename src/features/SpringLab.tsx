import { useEffect, useRef, useState } from 'react'
import { Icon } from '../components/Icons'
import { useCopy } from '../lib/useCopy'
import { useMotion } from '../lib/motion-context'

type SpringValues = { stiffness: number; damping: number; mass: number }

const presets: Array<{ name: string; values: SpringValues }> = [
  { name: 'Gentle', values: { stiffness: 120, damping: 20, mass: 1 } },
  { name: 'Snappy', values: { stiffness: 260, damping: 24, mass: 1 } },
  { name: 'Bouncy', values: { stiffness: 220, damping: 12, mass: 1.1 } },
  { name: 'Heavy', values: { stiffness: 90, damping: 16, mass: 2.2 } },
]

const STEP = 1 / 240

function simulateSettle({ stiffness, damping, mass }: SpringValues, maxSeconds = 6) {
  let x = 0
  let velocity = 0
  let elapsed = 0
  while (elapsed < maxSeconds) {
    const acceleration = (-stiffness * (x - 1) - damping * velocity) / mass
    velocity += acceleration * STEP
    x += velocity * STEP
    elapsed += STEP
    if (Math.abs(1 - x) < 0.002 && Math.abs(velocity) < 0.02) break
  }
  return { duration: Math.round(elapsed * 1000), samples: sampleSpring({ stiffness, damping, mass }, elapsed) }
}

function sampleSpring(values: SpringValues, settleSeconds: number, count = 32) {
  const { stiffness, damping, mass } = values
  const duration = Math.max(0.01, settleSeconds)
  const samples: number[] = []
  let x = 0
  let velocity = 0
  let elapsed = 0
  for (let index = 0; index <= count; index += 1) {
    const target = (index / count) * duration
    while (elapsed < target) {
      const acceleration = (-stiffness * (x - 1) - damping * velocity) / mass
      velocity += acceleration * STEP
      x += velocity * STEP
      elapsed += STEP
    }
    samples.push(Number(x.toFixed(3)))
  }
  samples[samples.length - 1] = 1
  return samples
}

export function SpringLab() {
  const [values, setValues] = useState<SpringValues>({ stiffness: 170, damping: 18, mass: 1 })
  const [status, setStatus] = useState('Ready. Run the spring to preview.')
  const stageRef = useRef<HTMLDivElement>(null)
  const blockRef = useRef<HTMLSpanElement>(null)
  const frameRef = useRef(0)
  const { reduced } = useMotion()
  const { copied, copy } = useCopy()

  const settle = simulateSettle(values)
  const duration = Math.max(100, settle.duration)
  const cssCurve = `linear(${settle.samples.join(', ')})`
  const code = `/* TEMPO — spring approximation */
.your-element {
  transition-property: transform;
  transition-duration: ${duration}ms;
  transition-timing-function: ${cssCurve};
}

/* Generated from stiffness ${values.stiffness}, damping ${values.damping}, mass ${values.mass}. */
/* linear() needs Chrome 113+, Safari 17.2+, Firefox 112+. */`

  const stop = () => {
    window.cancelAnimationFrame(frameRef.current)
    frameRef.current = 0
  }

  const run = (next: SpringValues = values) => {
    stop()
    const stage = stageRef.current
    const block = blockRef.current
    if (!stage || !block) return
    const travel = Math.max(0, stage.clientWidth - block.offsetWidth - 2)

    if (reduced) {
      block.style.transform = `translateX(${travel}px)`
      setStatus('Reduced motion is on. The spring jumps to its end state.')
      return
    }

    const { stiffness, damping, mass } = next
    let x = 0
    let velocity = 0
    let last: number | null = null
    setStatus('Running…')

    const tick = (now: number) => {
      if (last === null) last = now
      const delta = Math.min(0.048, (now - last) / 1000)
      last = now
      const steps = Math.max(1, Math.ceil(delta / STEP))
      const h = delta / steps
      for (let index = 0; index < steps; index += 1) {
        const acceleration = (-stiffness * (x - 1) - damping * velocity) / mass
        velocity += acceleration * h
        x += velocity * h
      }
      block.style.transform = `translateX(${Math.max(-0.08, x) * travel}px)`
      if (Math.abs(1 - x) < 0.0015 && Math.abs(velocity) < 0.02) {
        block.style.transform = `translateX(${travel}px)`
        setStatus(`Settled in about ${duration} ms.`)
        return
      }
      frameRef.current = window.requestAnimationFrame(tick)
    }

    frameRef.current = window.requestAnimationFrame(tick)
    setStatus('Running…')
  }

  useEffect(() => {
    const block = blockRef.current
    if (block) block.style.transform = 'translateX(0)'
    return stop
  }, [])

  const update = (key: keyof SpringValues, value: number) => {
    setValues((current) => ({ ...current, [key]: value }))
    setStatus('Parameters changed. Run again to feel the difference.')
  }

  return (
    <div className="spring-lab">
      <div className="spring-lab__controls">
        <fieldset className="lab-fieldset">
          <legend className="mono">Presets</legend>
          <div className="preset-grid preset-grid--two">
            {presets.map((preset) => {
              const active =
                preset.values.stiffness === values.stiffness &&
                preset.values.damping === values.damping &&
                preset.values.mass === values.mass
              return (
                <button
                  key={preset.name}
                  type="button"
                  className={active ? 'preset is-active' : 'preset'}
                  aria-pressed={active}
                  onClick={() => {
                    setValues(preset.values)
                    run(preset.values)
                  }}
                >
                  <span>{preset.name}</span>
                  <span className="preset__values mono">k {preset.values.stiffness} / c {preset.values.damping}</span>
                </button>
              )
            })}
          </div>
        </fieldset>

        <div className="spring-sliders">
          <div className="field">
            <label className="field__label" htmlFor="spring-stiffness">
              Stiffness
              <span className="field__value">{values.stiffness}</span>
            </label>
            <input
              id="spring-stiffness"
              type="range"
              min="40"
              max="400"
              step="5"
              value={values.stiffness}
              onChange={(event) => update('stiffness', Number(event.target.value))}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="spring-damping">
              Damping
              <span className="field__value">{values.damping}</span>
            </label>
            <input
              id="spring-damping"
              type="range"
              min="4"
              max="60"
              step="1"
              value={values.damping}
              onChange={(event) => update('damping', Number(event.target.value))}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="spring-mass">
              Mass
              <span className="field__value">{values.mass.toFixed(1)}</span>
            </label>
            <input
              id="spring-mass"
              type="range"
              min="0.5"
              max="4"
              step="0.1"
              value={values.mass}
              onChange={(event) => update('mass', Number(event.target.value))}
            />
          </div>
        </div>

        <div className="lab-control-actions">
          <button type="button" className="btn" onClick={() => run()}>
            <Icon name="play" size={14} /> Run spring
          </button>
          <span className="mono lab-settle">Settle ≈ {duration} ms</span>
        </div>
        <p className="lab-note" aria-live="polite">{status}</p>
      </div>

      <div className="spring-lab__stage">
        <div className="spring-stage" aria-hidden="true">
          <div className="spring-stage__head mono">
            <span>Spring stage</span>
            <span>0 → 1</span>
          </div>
          <div className="spring-stage__field" ref={stageRef}>
            <span className="spring-stage__rail" />
            <span className="spring-stage__target" />
            <span className="spring-block" ref={blockRef}>
              <span className="mono">m</span>
            </span>
          </div>
          <div className="spring-stage__foot mono">
            <span>k / {values.stiffness}</span>
            <span>c / {values.damping}</span>
            <span>m / {values.mass.toFixed(1)}</span>
          </div>
        </div>

        <div className="spring-readout">
          <div>
            <span className="mono">Generated timing</span>
            <code>linear({settle.samples.slice(0, 5).join(', ')}, …)</code>
          </div>
          <div>
            <span className="mono">Duration</span>
            <code>{duration} ms</code>
          </div>
        </div>

        <div className="code-block">
          <div className="code-block__bar">
            <span>CSS / spring approximation</span>
            <button type="button" className="copy-btn" onClick={() => copy(code)}>
              <Icon name={copied ? 'check' : 'copy'} size={13} />
              {copied ? 'Copied' : 'Copy CSS'}
            </button>
          </div>
          <pre tabIndex={0} aria-label="Code sample"><code>{code}</code></pre>
        </div>
      </div>
    </div>
  )
}
