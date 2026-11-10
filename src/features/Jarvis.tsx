import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icons'
import { useMotion } from '../lib/motion-context'
import { useCopy } from '../lib/useCopy'
import {
  getSpeechRecognition,
  setWakePreference,
  useWakePreference,
  type SpeechRecognitionLike,
} from '../lib/wake-word'
import { JARVIS_WAKE_EVENT, type JarvisWakeDetail } from '../lib/jarvis-events'
import {
  buildReply,
  quickPrompts,
  type JarvisAction,
  type JarvisContext,
  type JarvisReply,
} from '../lib/jarvis-brain'

type ChatMessage =
  | { id: number; role: 'user'; text: string }
  | { id: number; role: 'assistant'; reply: JarvisReply }

const coreBars = Array.from({ length: 28 }, (_, index) => 18 + Math.round(Math.abs(Math.sin(index * 1.37)) * 68))

const modePrompts = [
  { label: 'Explain a decision', prompt: 'Explain easing in plain English' },
  { label: 'Tune a component', prompt: 'What easing should I use for a dialog entrance?' },
  { label: 'Audit this page', prompt: 'Audit the motion on this page' },
  { label: 'Find a pattern', prompt: 'Which pattern should I use for a dialog?' },
]

function JarvisMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="30" height="30" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="2.5" fill="var(--signal)" />
      <path d="M16 2.5v6M16 23.5v6M2.5 16h6M23.5 16h6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function JarvisProse({ text }: { text: string }) {
  const blocks = text.split('\n\n')
  return (
    <div className="jarvis-prose">
      {blocks.map((block, blockIndex) => {
        const lines = block.split('\n')
        const isList = lines.every((line) => line.startsWith('- '))
        if (isList) {
          return (
            <ul key={`${blockIndex}-${block.slice(0, 24)}`}>
              {lines.map((line, lineIndex) => (
                <li key={`${lineIndex}-${line.slice(2, 20)}`}>{line.slice(2)}</li>
              ))}
            </ul>
          )
        }
        return (
          <p key={`${blockIndex}-${block.slice(0, 24)}`}>
            {lines.map((line, lineIndex) => (
              <Fragment key={`${lineIndex}-${line.slice(0, 20)}`}>
                {lineIndex > 0 && <br />}
                {line}
              </Fragment>
            ))}
          </p>
        )
      })}
    </div>
  )
}

function JarvisCode({ label, code }: { label: string; code: string }) {
  const { copied, copy } = useCopy()
  return (
    <div className="jarvis-code">
      <div className="jarvis-code__bar">
        <span>{label}</span>
        <button type="button" onClick={() => copy(code)}>
          <Icon name={copied ? 'check' : 'copy'} size={12} />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre tabIndex={0} aria-label={`${label} code`}>
        <code>{code}</code>
      </pre>
    </div>
  )
}

function JarvisIntro({
  context,
  onPrompt,
}: {
  context: JarvisContext
  onPrompt: (prompt: string) => void
}) {
  const prompts = quickPrompts(context)
  return (
    <div className="jarvis-intro">
      <p className="jarvis-intro__eyebrow mono">
        <span className="jarvis-intro__dot" aria-hidden="true" />
        Local pilot / motion intelligence
      </p>
      <h2 className="jarvis-intro__title">
        What are we <em>tuning?</em>
      </h2>
      <p className="jarvis-intro__copy">
        Explain a timing decision, draft a stagger, or audit the page in front of you. I run in this
        browser and keep the transcript in memory only.
      </p>
      <div className="jarvis-suggestions">
        {prompts.map((prompt, index) => (
          <button key={prompt.label} type="button" onClick={() => onPrompt(prompt.prompt)}>
            <span className="jarvis-suggestions__index mono">{String(index + 1).padStart(2, '0')}</span>
            <span className="jarvis-suggestions__label">{prompt.label}</span>
            <span className="jarvis-suggestions__meta mono">{prompt.meta}</span>
            <Icon name="arrow-up-right" size={15} />
          </button>
        ))}
      </div>
    </div>
  )
}

function JarvisThinking({ listening }: { listening: boolean }) {
  return (
    <div className="jarvis-thinking" role="status">
      <span className="jarvis-thinking__bars" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className="mono">{listening ? 'Listening' : 'Composing a useful answer'}</span>
    </div>
  )
}

export function Jarvis({ open, onClose }: { open: boolean; onClose: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { reduced, setPreference } = useMotion()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [thinking, setThinking] = useState(false)
  const [listening, setListening] = useState(false)
  const [voiceReplies, setVoiceReplies] = useState(false)
  const [status, setStatus] = useState('')
  const wakeEnabled = useWakePreference()

  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const idRef = useRef(0)
  const thinkingRef = useRef(false)
  const timerRef = useRef<number | undefined>(undefined)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  const context = useMemo<JarvisContext>(
    () => ({ path: location.pathname, search: location.search, reduced }),
    [location.pathname, location.search, reduced],
  )

  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window
  const Recognition = useMemo(() => getSpeechRecognition(), [])

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text.replace(/`([^`]+)`/g, '$1'))
    utterance.rate = 1.02
    utterance.pitch = 0.92
    window.speechSynthesis.speak(utterance)
  }, [])

  const nextId = useCallback(() => {
    idRef.current += 1
    return idRef.current
  }, [])

  const appendAssistant = useCallback(
    (reply: JarvisReply) => {
      setMessages((current) => [...current, { id: nextId(), role: 'assistant', reply }])
      if (voiceReplies) speak(reply.text)
    },
    [nextId, speak, voiceReplies],
  )

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim()
      if (!text || thinkingRef.current) return
      thinkingRef.current = true
      setStatus('')
      setDraft('')
      setMessages((current) => [...current, { id: nextId(), role: 'user', text }])
      setThinking(true)

      window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => {
        let reply: JarvisReply
        try {
          reply = buildReply(text, {
            path: location.pathname,
            search: location.search,
            reduced,
          })
        } catch {
          reply = {
            text: 'Something went wrong while composing that answer. The transcript is still here. Try a shorter prompt, or start again.',
            actions: [{ label: 'What can you do?', kind: 'prompt', prompt: 'What can you do?' }],
          }
        }
        setMessages((current) => [...current, { id: nextId(), role: 'assistant', reply }])
        setThinking(false)
        thinkingRef.current = false
        if (voiceReplies) speak(reply.text)
      }, 520 + Math.min(520, text.length * 7))
    },
    [location.pathname, location.search, nextId, reduced, speak, voiceReplies],
  )

  const clear = useCallback(() => {
    window.clearTimeout(timerRef.current)
    thinkingRef.current = false
    setThinking(false)
    setMessages([])
    setDraft('')
    setStatus('Transcript cleared.')
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }, [])

  const runAction = useCallback(
    (action: JarvisAction) => {
      if (action.kind === 'prompt') {
        send(action.prompt)
        return
      }
      if (action.kind === 'navigate') {
        onClose()
        navigate(action.to)
        return
      }
      setPreference(action.value)
      const reply: JarvisReply =
        action.value === 'reduced'
          ? {
              text: 'Motion is off. The content is still here; the travel is not. Check that every state resolved to its final position.',
              actions: [
                { label: 'Audit this page', kind: 'prompt', prompt: 'Audit the motion on this page' },
                { label: 'Turn motion on', kind: 'motion', value: 'full' },
              ],
            }
          : {
              text: 'Motion is on. If you are checking the reduced path, flip it back off before you finish and confirm every state still reads without the movement.',
              actions: [
                { label: 'Audit this page', kind: 'prompt', prompt: 'Audit the motion on this page' },
                { label: 'Turn motion off', kind: 'motion', value: 'reduced' },
              ],
            }
      appendAssistant(reply)
      setStatus(action.value === 'reduced' ? 'Motion reduced.' : 'Motion restored.')
    },
    [appendAssistant, navigate, onClose, send, setPreference],
  )

  const startListening = useCallback(() => {
    if (!Recognition) {
      setStatus('Voice input is not supported in this browser. You can still type.')
      return
    }
    if (listening) {
      recognitionRef.current?.stop()
      return
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()

    const recognition = new Recognition()
    recognition.lang = navigator.language || 'en-US'
    recognition.continuous = false
    recognition.interimResults = true
    recognition.onstart = () => {
      setListening(true)
      setStatus('Listening. Speak your question.')
    }
    recognition.onresult = (event) => {
      let transcript = ''
      let finalTranscript = ''
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        const text = result[0]?.transcript ?? ''
        transcript += text
        if (result.isFinal) finalTranscript += text
      }
      if (finalTranscript.trim()) {
        setDraft('')
        send(finalTranscript)
        recognition.stop()
      } else {
        setDraft(transcript)
      }
    }
    recognition.onerror = (event) => {
      const message =
        event.error === 'not-allowed' || event.error === 'service-not-allowed'
          ? 'Microphone permission was blocked. You can still type.'
          : event.error === 'no-speech'
            ? 'I did not hear anything. Try again or type.'
            : 'Voice input stopped unexpectedly. You can still type.'
      setStatus(message)
      setListening(false)
    }
    recognition.onend = () => {
      setListening(false)
      recognitionRef.current = null
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch {
      setStatus('Voice input is unavailable right now. You can still type.')
      setListening(false)
    }
  }, [Recognition, listening, send])

  const pendingWakeRef = useRef<JarvisWakeDetail | null>(null)

  useEffect(() => {
    const onWake = (event: Event) => {
      const detail = (event as CustomEvent<JarvisWakeDetail>).detail
      pendingWakeRef.current = { command: detail?.command?.trim() ?? '' }
    }
    window.addEventListener(JARVIS_WAKE_EVENT, onWake)
    return () => window.removeEventListener(JARVIS_WAKE_EVENT, onWake)
  }, [])

  useEffect(() => {
    if (!open) return
    const pending = pendingWakeRef.current
    if (!pending) return
    pendingWakeRef.current = null
    const timeout = window.setTimeout(() => {
      if (pending.command) send(pending.command)
      else startListening()
    }, 380)
    return () => window.clearTimeout(timeout)
  }, [open, send, startListening])

  useEffect(() => {
    if (!open) return
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.body.classList.add('jarvis-open')
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus())

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return
      const items = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((item) => item.offsetParent !== null)
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.cancelAnimationFrame(frame)
      document.body.classList.remove('jarvis-open')
      document.removeEventListener('keydown', onKeyDown)
      recognitionRef.current?.abort()
      recognitionRef.current = null
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
      returnFocusRef.current?.focus({ preventScroll: true })
    }
  }, [onClose, open])

  useEffect(() => {
    if (!open) return
    const frame = window.requestAnimationFrame(() => {
      const log = logRef.current
      if (log) log.scrollTop = log.scrollHeight
    })
    return () => window.cancelAnimationFrame(frame)
  }, [messages, thinking, open])

  useEffect(() => {
    const node = inputRef.current
    if (!node) return
    node.style.height = 'auto'
    node.style.height = `${Math.min(144, node.scrollHeight)}px`
  }, [draft, open])

  useEffect(() => {
    return () => {
      window.clearTimeout(timerRef.current)
      recognitionRef.current?.abort()
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    }
  }, [])

  if (!open) return null

  const statusLabel = listening ? 'Listening' : thinking ? 'Thinking' : 'Ready'
  const isEmpty = messages.length === 0 && !thinking

  return (
    <div
      className="jarvis"
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="jarvis-title"
      aria-describedby="jarvis-desc"
    >
      <div className="jarvis__grid" aria-hidden="true" />
      <h2 id="jarvis-title" className="visually-hidden">
        Jarvis, TEMPO’s motion assistant
      </h2>
      <p id="jarvis-desc" className="visually-hidden">
        Ask about interface motion, tune a curve, or audit the current page. Jarvis runs locally in
        this browser.
      </p>

      <header className="jarvis__top">
        <div className="jarvis__identity">
          <JarvisMark className="jarvis__mark" />
          <div>
            <span className="jarvis__wordmark">JARVIS</span>
            <span className="jarvis__sub mono">Motion pilot / edition 01</span>
          </div>
        </div>
        <div className="jarvis__top-actions">
          <span className="jarvis__live mono">
            <span className="jarvis__live-dot" aria-hidden="true" />
            Local / {statusLabel}
          </span>
          <button
            type="button"
            className="jarvis__text-btn"
            onClick={clear}
            disabled={!messages.length && !thinking}
          >
            Clear
          </button>
          <button type="button" className="jarvis__close" onClick={onClose} aria-label="Close Jarvis" aria-keyshortcuts="Escape" title="Close Jarvis (Esc)">
            <Icon name="close" size={17} />
          </button>
        </div>
      </header>

      <div className="jarvis__body">
        <aside className="jarvis__rail" aria-label="Jarvis context and controls">
          <div className={`jarvis__core ${thinking || listening ? 'is-active' : ''}`}>
            <div className="jarvis__core-head mono">
              <span>Core / signal</span>
              <span>J-01</span>
            </div>
            <div className="jarvis__bars" aria-hidden="true">
              {coreBars.map((height, index) => (
                <span
                  key={index}
                  style={{ height: `${height}%`, animationDelay: `${(index % 9) * -0.17}s` }}
                />
              ))}
            </div>
            <div className="jarvis__core-foot mono">
              <span>{listening ? 'Input / voice' : thinking ? 'Input / query' : 'Input / ready'}</span>
              <span>Local</span>
            </div>
          </div>

          <div className="jarvis__rail-block jarvis__rail-block--context">
            <span className="jarvis__rail-label mono">Context</span>
            <dl className="jarvis__context">
              <div>
                <dt>Page</dt>
                <dd>{location.pathname === '/' ? 'Index' : location.pathname.replace('/', '')}</dd>
              </div>
              <div>
                <dt>Motion</dt>
                <dd>{reduced ? 'Reduced' : 'Full'}</dd>
              </div>
              <div>
                <dt>Memory</dt>
                <dd>This session</dd>
              </div>
            </dl>
          </div>

          <div className="jarvis__rail-block jarvis__rail-block--modes">
            <span className="jarvis__rail-label mono">Start with</span>
            <div className="jarvis__modes">
              {modePrompts.map((mode) => (
                <button key={mode.label} type="button" onClick={() => send(mode.prompt)}>
                  <span>{mode.label}</span>
                  <Icon name="arrow-up-right" size={14} />
                </button>
              ))}
            </div>
          </div>

          <div className="jarvis__voice">
            <div className="jarvis__switches">
              <button
                type="button"
                role="switch"
                aria-checked={wakeEnabled}
                className="jarvis__switch"
                disabled={!Recognition}
                onClick={() => {
                  if (!Recognition) {
                    setStatus('Wake word is not supported in this browser. Use the Voice button instead.')
                    return
                  }
                  const next = !wakeEnabled
                  setWakePreference(next)
                  setStatus(
                    next
                      ? 'Wake word armed. Close this panel and say “Jarvis”.'
                      : 'Wake word off.',
                  )
                  if (next && 'speechSynthesis' in window) window.speechSynthesis.cancel()
                }}
              >
                <span className="jarvis__switch-label">
                  <span className="jarvis__switch-dot" aria-hidden="true" />
                  Wake word “Jarvis”
                </span>
                <span className="mono">{!Recognition ? 'N/A' : wakeEnabled ? 'On' : 'Off'}</span>
              </button>
              <button
                type="button"
                role="switch"
                aria-checked={voiceReplies}
                className="jarvis__switch"
                onClick={() => {
                  if (!canSpeak) {
                    setStatus('Voice replies are not supported in this browser.')
                    return
                  }
                  setVoiceReplies((value) => !value)
                  if (voiceReplies && 'speechSynthesis' in window) window.speechSynthesis.cancel()
                }}
              >
                <span className="jarvis__switch-label">
                  <span className="jarvis__switch-dot" aria-hidden="true" />
                  Read replies aloud
                </span>
                <span className="mono">{voiceReplies ? 'On' : 'Off'}</span>
              </button>
            </div>
            <p>
              Both use your browser’s speech tools. Wake word listens only while this tab is open;
              say “Jarvis” while the panel is closed. The site stores no audio or transcript, but
              your browser may process speech on its own servers.
            </p>
          </div>
        </aside>

        <section className="jarvis__chat" aria-label="Conversation with Jarvis">
          <div
            className={isEmpty ? 'jarvis__log jarvis__log--empty' : 'jarvis__log'}
            ref={logRef}
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
            aria-busy={thinking}
          >
            {isEmpty && <JarvisIntro context={context} onPrompt={send} />}

            {messages.length > 0 && (
              <ol className="jarvis__transcript">
                {messages.map((message, index) =>
                  message.role === 'user' ? (
                    <li key={message.id} className="jarvis-msg jarvis-msg--user">
                      <div className="jarvis-msg__meta mono">
                        <span>You</span>
                        <span>{String(index + 1).padStart(2, '0')}</span>
                      </div>
                      <p className="jarvis-msg__user-copy">{message.text}</p>
                    </li>
                  ) : (
                    <li key={message.id} className="jarvis-msg jarvis-msg--assistant">
                      <div className="jarvis-msg__meta mono">
                        <span>Jarvis</span>
                        <span>{String(index + 1).padStart(2, '0')}</span>
                      </div>
                      <JarvisProse text={message.reply.text} />
                      {message.reply.code && (
                        <JarvisCode label={message.reply.code.label} code={message.reply.code.code} />
                      )}
                      {message.reply.actions && message.reply.actions.length > 0 && (
                        <div className="jarvis-msg__actions">
                          {message.reply.actions.map((action, actionIndex) => (
                            <button
                              key={`${action.label}-${actionIndex}`}
                              type="button"
                              className={
                                actionIndex === 0
                                  ? 'jarvis-action jarvis-action--primary'
                                  : 'jarvis-action'
                              }
                              onClick={() => runAction(action)}
                            >
                              {action.label}
                              <Icon name="arrow" size={13} />
                            </button>
                          ))}
                        </div>
                      )}
                      {message.reply.suggestions && message.reply.suggestions.length > 0 && (
                        <div className="jarvis-msg__suggestions">
                          <span className="mono">Keep going</span>
                          {message.reply.suggestions.map((suggestion) => (
                            <button key={suggestion} type="button" onClick={() => send(suggestion)}>
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </li>
                  ),
                )}
              </ol>
            )}

            {thinking && <JarvisThinking listening={listening} />}
          </div>

          <div className="jarvis__composer">
            <form
              className="jarvis__form"
              onSubmit={(event) => {
                event.preventDefault()
                send(draft)
              }}
            >
              <label className="visually-hidden" htmlFor="jarvis-input">
                Ask Jarvis about motion
              </label>
              <textarea
                id="jarvis-input"
                ref={inputRef}
                rows={1}
                value={draft}
                maxLength={800}
                placeholder="Ask about a curve, a spring, a pattern…"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault()
                    send(draft)
                  }
                }}
              />
              <div className="jarvis__form-foot">
                <span className="jarvis__keyhint mono">
                  Enter to send <span>/</span> Shift + Enter for a new line
                </span>
                <div className="jarvis__form-actions">
                  {Recognition && (
                    <button
                      type="button"
                      className={listening ? 'jarvis-mic is-listening' : 'jarvis-mic'}
                      aria-pressed={listening}
                      onClick={startListening}
                      title={listening ? 'Stop listening' : 'Dictate a question'}
                    >
                      <Icon name="mic" size={16} />
                      <span>{listening ? 'Stop' : 'Voice'}</span>
                    </button>
                  )}
                  <button
                    type="submit"
                    className="jarvis-send"
                    disabled={!draft.trim() || thinking}
                  >
                    <span>Send</span>
                    <Icon name="arrow" size={15} />
                  </button>
                </div>
              </div>
            </form>
            <div className="jarvis__composer-meta mono">
              <span>Local pilot / no cloud model / no transcript stored</span>
              <span className="jarvis__status" role="status" aria-live="polite">
                {status}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
