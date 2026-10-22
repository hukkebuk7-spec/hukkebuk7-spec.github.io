import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Icon, Wordmark } from './Icons'
import { useMotion } from '../lib/motion-context'

const navItems = [
  { to: '/lab', label: 'Lab', index: '02' },
  { to: '/library', label: 'Library', index: '03' },
  { to: '/about', label: 'About', index: '04' },
]

export function MotionToggle({ dark = false }: { dark?: boolean }) {
  const { reduced, toggle } = useMotion()
  return (
    <button
      type="button"
      className="motion-toggle"
      role="switch"
      aria-checked={!reduced}
      onClick={toggle}
      title="Toggle interface animation"
      style={dark ? { color: 'var(--paper)' } : undefined}
    >
      <span className="motion-toggle__dot" aria-hidden="true" />
      <span>Motion {reduced ? 'off' : 'on'}</span>
    </button>
  )
}

function ScrollProgress() {
  const barRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div className="scroll-progress" aria-hidden="true">
      <span ref={barRef} className="scroll-progress__bar" />
    </div>
  )
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen)
    if (!menuOpen) return

    const node = menuRef.current
    const focusable = node?.querySelector<HTMLElement>('a, button')
    focusable?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        toggleRef.current?.focus()
        return
      }
      if (event.key !== 'Tab' || !node) return
      const items = Array.from(node.querySelectorAll<HTMLElement>('a, button'))
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
      document.body.classList.remove('menu-open')
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner wrap">
          <Link to="/" className="brand">
            <Wordmark className="brand__mark" />
            <span className="brand__name">TEMPO</span>
            <span className="brand__sub mono">A field guide<br />to interface motion</span>
          </Link>

          <nav className="site-nav" aria-label="Primary">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className="site-nav__link">
                <sup aria-hidden="true">{item.index}</sup>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="header-actions">
            <MotionToggle />
            <button
              ref={toggleRef}
              type="button"
              className="menu-toggle"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="menu-toggle__bars" aria-hidden="true" />
              {menuOpen ? 'Close' : 'Menu'}
            </button>
          </div>
        </div>
        <ScrollProgress />
      </header>

      {menuOpen && (
        <div className="mobile-menu" id="mobile-menu" ref={menuRef}>
          <nav className="mobile-menu__nav" aria-label="Mobile">
            <NavLink to="/lab" className="mobile-menu__link" onClick={() => setMenuOpen(false)}>
              02 <em>Lab</em> <span>Ease · spring · stagger</span>
            </NavLink>
            <NavLink to="/library" className="mobile-menu__link" onClick={() => setMenuOpen(false)}>
              03 <em>Library</em> <span>Twelve patterns</span>
            </NavLink>
            <NavLink to="/about" className="mobile-menu__link" onClick={() => setMenuOpen(false)}>
              04 <em>About</em> <span>Method &amp; colophon</span>
            </NavLink>
            <NavLink to="/" className="mobile-menu__link" onClick={() => setMenuOpen(false)}>
              01 <em>Index</em> <span>Start here</span>
            </NavLink>
          </nav>
          <div>
            <MotionToggle dark />
            <div className="mobile-menu__foot mono">
              <span>Edition 01 / 2026</span>
              <span>No trackers</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-top mono">
          <span>End of edition 01</span>
          <a className="text-link" href="#main">
            Back to top <Icon name="arrow" size={14} />
          </a>
        </div>

        <div className="footer-word" aria-hidden="true">
          TEMPO<span>.</span>
        </div>

        <div className="footer-grid">
          <div className="footer-col">
            <div className="footer-col__title mono">The premise</div>
            <p>
              Motion is not decoration. It is how an interface explains itself. This guide collects
              working patterns, honest constraints, and a few opinions worth testing.
            </p>
          </div>
          <div className="footer-col">
            <div className="footer-col__title mono">Explore</div>
            <div className="footer-links">
              <Link to="/lab">Easing lab</Link>
              <Link to="/lab#spring">Spring lab</Link>
              <Link to="/library">Pattern library</Link>
              <Link to="/about">Method &amp; colophon</Link>
            </div>
          </div>
          <div className="footer-col">
            <div className="footer-col__title mono">Reference</div>
            <div className="footer-links">
              <a href="https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html" target="_blank" rel="noreferrer">
                WCAG 2.2 animation
              </a>
              <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function" target="_blank" rel="noreferrer">
                CSS easing functions
              </a>
              <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API" target="_blank" rel="noreferrer">
                Web Animations API
              </a>
            </div>
          </div>
          <div className="footer-col">
            <div className="footer-col__title mono">Colophon</div>
            <p>
              Set in Bricolage Grotesque, Instrument Serif, and DM Mono. Built with React, Vite, and
              GSAP. No cookies, analytics, or newsletter.
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 TEMPO — independent field guide</span>
          <span>Designed &amp; built for the open web</span>
        </div>
      </div>
    </footer>
  )
}
