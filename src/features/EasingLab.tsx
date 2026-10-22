import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCopy } from '../lib/useCopy'
import { useMotion } from '../lib/motion-context'
import { Icon } from '../components/Icons'
import { clamp, easingPresets, formatEasing } from './easing'

type Curve = [number, number, number, number]

const VIEW = 320
const PAD = 42
const SIZE = VIEW - PAD * 2

const parseCurve = (raw: string | null): Curve => {
  if (!raw) return [0.16, 1, 0.3, 1]
  const parts = raw.split(',').map(Number)
  if (parts.length !== 4 || parts.some((value) => !Number.isFinite(value))) {
    return [0.16, 1, 0.3, 1]
  }
  return [
    clamp(parts[0], 0, 1),
    clamp(parts[1], 0, 1),
    clamp(parts[2], 0, 1),
    clamp(parts[3], 0, 1),
  ]
}

const parseDuration = (raw: string | null) => {
  if (raw === null) return 640
  const value = Number(raw)
  return Number.isFinite(value) ? clamp(value, 100, 1200) : 640
}

const mapX = (x: number) => PAD + x * SIZE
const mapY = (y: number) => PAD + SIZE - y * SIZE

function CurveEditor({
  curve,
  onChange,
}: {
  curve: Curve
  onChange: (next: Curve) => void
}) {
  const [dragging, setDragging] = useState<number | null>(null)

  const updateFromPointer = (event: React.PointerEvent<SVGSVGElement>) => {
    if (dragging === null) return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * VIEW
    const y = ((event.clientY - rect.top) / rect.height) * VIEW
    const nx = clamp((x - PAD) / SIZE, 0, 1)
    const ny = clamp((PAD + SIZE - y) / SIZE, 0, 1)
    const next: Curve = [...curve] as Curve
    next[dragging * 2] = Number(nx.toFixed(2))
    next[dragging * 2 + 1] = Number(ny.toFixed(2))
    onChange(next)
  }

  const startDrag = (index: number) => (event: React.PointerEvent<SVGGElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(index)
  }

  const endDrag = () => {
    setDragging(null)
  }

  const [x1, y1, x2, y2] = curve
  const start = { x: mapX(0), y: mapY(0) }
  const end = { x: mapX(1), y: mapY(1) }
  const c1 = { x: mapX(x1), y: mapY(y1) }
  const c2 = { x: mapX(x2), y: mapY(y2) }
  const path = `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`

  return (
    <svg
      className="curve-editor"
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      fill="none"
      role="img"
      aria-label={`Cubic bezier curve with control points ${curve.join(', ')}`}
      onPointerMove={updateFromPointer}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <rect x={PAD} y={PAD} width={SIZE} height={SIZE} stroke="currentColor" strokeOpacity="0.35" />
      {[0.25, 0.5, 0.75].map((fraction) => (
        <g key={fraction} stroke="currentColor" strokeOpacity="0.12" strokeDasharray="2 6">
          <line x1={mapX(fraction)} y1={PAD} x2={mapX(fraction)} y2={PAD + SIZE} />
          <line x1={PAD} y1={mapY(fraction)} x2={PAD + SIZE} y2={mapY(fraction)} />
        </g>
      ))}
      <text x={PAD - 10} y={PAD + SIZE + 4} textAnchor="end" className="curve-editor__label">0</text>
      <text x={PAD - 10} y={PAD + 4} textAnchor="end" className="curve-editor__label">1</text>
      <text x={PAD} y={PAD + SIZE + 20} textAnchor="middle" className="curve-editor__label">0</text>
      <text x={PAD + SIZE} y={PAD + SIZE + 20} textAnchor="middle" className="curve-editor__label">1</text>
      <line x1={start.x} y1={start.y} x2={c1.x} y2={c1.y} stroke="var(--signal)" strokeDasharray="3 4" />
      <line x1={end.x} y1={end.y} x2={c2.x} y2={c2.y} stroke="var(--signal)" strokeDasharray="3 4" />
      <path d={path} stroke="var(--ink)" strokeWidth="2.5" />
      <circle cx={start.x} cy={start.y} r="4" fill="var(--ink)" />
      <circle cx={end.x} cy={end.y} r="4" fill="var(--ink)" />
      <g
        className="curve-editor__handle"
        onPointerDown={startDrag(0)}
        role="presentation"
      >
        <circle cx={c1.x} cy={c1.y} r="16" fill="transparent" />
        <circle cx={c1.x} cy={c1.y} r="8" fill="var(--paper-raised)" stroke="var(--ink)" strokeWidth="2" />
        <circle cx={c1.x} cy={c1.y} r="2.5" fill="var(--signal)" />
      </g>
      <g
        className="curve-editor__handle"
        onPointerDown={startDrag(1)}
        role="presentation"
      >
        <circle cx={c2.x} cy={c2.y} r="16" fill="transparent" />
        <circle cx={c2.x} cy={c2.y} r="8" fill="var(--paper-raised)" stroke="var(--ink)" strokeWidth="2" />
        <circle cx={c2.x} cy={c2.y} r="2.5" fill="var(--signal)" />
      </g>
      <text x={c1.x} y={c1.y - 16} textAnchor="middle" className="curve-editor__label curve-editor__label--signal">P1</text>
      <text x={c2.x} y={c2.y - 16} textAnchor="middle" className="curve-editor__label curve-editor__label--signal">P2</text>
    </svg>
  )
}

export function EasingLab() {
  const [params, setParams] = useSearchParams()
  const [curve, setCurve] = useState<Curve>(() => parseCurve(params.get('ease')))
  const [duration, setDuration] = useState(() => parseDuration(params.get('d')))
  const [runId, setRunId] = useState(0)
  const [travel, setTravel] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLSpanElement>(null)
  const { reduced } = useMotion()
  const { copied, copy } = useCopy()
  const { copied: codeCopied, copy: copyCode } = useCopy()
  const { copied: linkCopied, copy: copyLink } = useCopy()

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const next = new URLSearchParams(window.location.search)
      next.set('ease', curve.join(','))
      next.set('d', String(duration))
      setParams(next, { replace: true })
    }, 250)
    return () => window.clearTimeout(timeout)
  }, [curve, duration, setParams])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const measure = () => setTravel(Math.max(0, track.clientWidth - 16))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(track)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const dot = dotRef.current
    if (!dot || travel <= 0) return
    const easing = formatEasing(curve)
    if (reduced) {
      dot.style.transform = `translateX(${travel}px)`
      return
    }
    const animation = dot.animate(
      [{ transform: 'translateX(0)' }, { transform: `translateX(${travel}px)` }],
      { duration, easing, fill: 'forwards' },
    )
    return () => animation.cancel()
  }, [runId, curve, duration, travel, reduced])

  const code = `/* TEMPO — easing lab */
.your-element {
  transition-property: transform, opacity;
  transition-duration: ${duration}ms;
  transition-timing-function: ${formatEasing(curve)};
}

@media (prefers-reduced-motion: reduce) {
  .your-element {
    transition-duration: 0.01ms;
  }
}`

  const curveLabels: Array<{ key: 0 | 1 | 2 | 3; label: string }> = [
    { key: 0, label: 'P1 X' },
    { key: 1, label: 'P1 Y' },
    { key: 2, label: 'P2 X' },
    { key: 3, label: 'P2 Y' },
  ]

  return (
    <div className="easing-lab">
      <div className="easing-lab__controls">
        <fieldset className="lab-fieldset">
          <legend className="mono">Presets</legend>
          <div className="preset-grid">
            {easingPresets.map((preset) => (
              <button
                key={preset.name}
                type="button"
                className={
                  curve.every((value, index) => value === preset.values[index]) ? 'preset is-active' : 'preset'
                }
                onClick={() => {
                  setCurve(preset.values)
                  setRunId((value) => value + 1)
                }}
                aria-pressed={curve.every((value, index) => value === preset.values[index])}
                title={preset.note}
              >
                <span>{preset.name}</span>
                <span className="preset__values mono">{preset.values.join(' / ')}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="lab-fieldset">
          <legend className="mono">Control points</legend>
          <div className="curve-sliders">
            {curveLabels.map(({ key, label }) => (
              <div className="field" key={label}>
                <label className="field__label" htmlFor={`curve-${key}`}>
                  {label}
                  <span className="field__value">{curve[key].toFixed(2)}</span>
                </label>
                <input
                  id={`curve-${key}`}
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={curve[key]}
                  onChange={(event) => {
                    const next: Curve = [...curve] as Curve
                    next[key] = Number(event.target.value)
                    setCurve(next)
                  }}
                />
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset className="lab-fieldset">
          <legend className="mono">Duration</legend>
          <div className="field">
            <label className="field__label" htmlFor="curve-duration">
              Transition time
              <span className="field__value">{duration} ms</span>
            </label>
            <input
              id="curve-duration"
              type="range"
              min="100"
              max="1200"
              step="10"
              value={duration}
              onChange={(event) => setDuration(Number(event.target.value))}
            />
          </div>
          <div className="lab-hint-row">
            <span className="mono">100 ms</span>
            <span className="mono">1200 ms</span>
          </div>
        </fieldset>

        <div className="lab-control-actions">
          <button type="button" className="btn" onClick={() => setRunId((value) => value + 1)}>
            <Icon name="play" size={14} /> Play preview
          </button>
          <button
            type="button"
            className="copy-btn copy-btn--paper"
            onClick={() => copy(`${formatEasing(curve)}; ${duration}ms`)}
          >
            <Icon name={copied ? 'check' : 'copy'} size={13} />
            {copied ? 'Copied' : 'Copy curve'}
          </button>
        </div>
        <p className="lab-note">{easingPresets.find((preset) => preset.values.every((value, index) => value === curve[index]))?.note ?? 'A custom curve. Trust the preview, then test it in context.'}</p>
      </div>

      <div className="easing-lab__stage">
        <div className="curve-panel">
          <div className="curve-panel__top">
            <span className="mono">Cubic bezier editor</span>
            <span className="mono">Drag P1 / P2</span>
          </div>
          <CurveEditor curve={curve} onChange={setCurve} />
          <div className="curve-panel__readout mono">
            {curve.map((value, index) => (
              <span key={index}>
                {['x1', 'y1', 'x2', 'y2'][index]} {value.toFixed(2)}
              </span>
            ))}
          </div>
        </div>

        <div className="motion-stage" aria-hidden="true">
          <div className="motion-stage__labels mono">
            <span>Start</span>
            <span>{formatEasing(curve)}</span>
            <span>End</span>
          </div>
          <div className="motion-track" ref={trackRef}>
            <span className="motion-track__line" />
            <span className="motion-track__origin" />
            <span className="motion-track__end" />
            <span className="motion-dot" ref={dotRef} />
          </div>
          {reduced && <p className="motion-stage__note mono">Reduced motion / preview holds at the end state</p>}
        </div>

        <div className="code-block">
          <div className="code-block__bar">
            <span>CSS / production</span>
            <button type="button" className="copy-btn" onClick={() => copyCode(code)}>
              <Icon name={codeCopied ? 'check' : 'copy'} size={13} />
              {codeCopied ? 'Copied' : 'Copy CSS'}
            </button>
          </div>
          <pre tabIndex={0} aria-label="Code sample"><code>{code}</code></pre>
        </div>

        <div className="lab-share">
          <span className="mono">This curve lives in the URL.</span>
          <button type="button" className="text-link" onClick={() => copyLink(window.location.href)}>
            <Icon name={linkCopied ? 'check' : 'copy'} size={13} />
            {linkCopied ? 'Link copied' : 'Copy share link'}
          </button>
        </div>
      </div>
    </div>
  )
}
