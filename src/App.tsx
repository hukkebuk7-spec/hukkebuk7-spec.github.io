import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { Footer, Header } from './components/Chrome'
import { Home } from './pages/Home'
import { NotFound } from './pages/NotFound'
import { Jarvis } from './features/Jarvis'
import { WakeWord } from './components/WakeWord'
import { JARVIS_OPEN_EVENT } from './lib/jarvis-events'

const Lab = lazy(() => import('./pages/Lab').then((module) => ({ default: module.Lab })))
const Library = lazy(() => import('./pages/Library').then((module) => ({ default: module.Library })))
const About = lazy(() => import('./pages/About').then((module) => ({ default: module.About })))

function Layout() {
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const firstRender = useRef(true)
  const [announcement, setAnnouncement] = useState('')
  const [wipeKey, setWipeKey] = useState(0)
  const [jarvisOpen, setJarvisOpen] = useState(false)
  const previousPath = useRef(location.pathname)
  const closeJarvis = useCallback(() => setJarvisOpen(false), [])

  useEffect(() => {
    let frame = 0
    let attempt = 0
    let cancelled = false

    const scrollToHash = () => {
      if (cancelled) return
      let target: HTMLElement | null = null
      const id = location.hash.slice(1)
      if (id) {
        try {
          target = document.getElementById(decodeURIComponent(id))
        } catch {
          target = null
        }
      }
      if (target) {
        target.scrollIntoView({ block: 'start' })
        document.fonts?.ready.then(() => {
          if (!cancelled) target?.scrollIntoView({ block: 'start' })
        })
        return
      }
      if (attempt++ < 240) frame = window.requestAnimationFrame(scrollToHash)
    }

    if (location.hash) {
      frame = window.requestAnimationFrame(scrollToHash)
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }

    const announce = !firstRender.current
    firstRender.current = false
    if (announce) mainRef.current?.focus({ preventScroll: true })
    const timeout = announce ? window.setTimeout(() => setAnnouncement(document.title), 150) : 0

    return () => {
      cancelled = true
      window.cancelAnimationFrame(frame)
      if (timeout) window.clearTimeout(timeout)
    }
  }, [location.pathname, location.hash])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setJarvisOpen((value) => !value)
      }
    }
    const onOpen = () => setJarvisOpen(true)
    const onPopState = () => setJarvisOpen(false)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener(JARVIS_OPEN_EVENT, onOpen)
    window.addEventListener('popstate', onPopState)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener(JARVIS_OPEN_EVENT, onOpen)
      window.removeEventListener('popstate', onPopState)
    }
  }, [])

  useEffect(() => {
    if (previousPath.current === location.pathname) return
    previousPath.current = location.pathname
    setWipeKey((value) => value + 1)
    const timeout = window.setTimeout(() => setWipeKey(0), 720)
    return () => window.clearTimeout(timeout)
  }, [location.pathname])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && document.activeElement === mainRef.current) {
        mainRef.current?.blur()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>
      <div className="site-shell" inert={jarvisOpen || undefined}>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Header />
        <main id="main" ref={mainRef} tabIndex={-1}>
          <div key={location.pathname} className="route-enter">
            <Suspense
              fallback={
                <p className="route-loading mono" role="status">
                  Loading page…
                </p>
              }
            >
              <Outlet />
            </Suspense>
          </div>
        </main>
        <Footer />
      </div>
      {wipeKey > 0 && <div key={wipeKey} className="route-wipe" aria-hidden="true" />}
      <WakeWord paused={jarvisOpen} />
      <Jarvis open={jarvisOpen} onClose={closeJarvis} />
      <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </>
  )
}

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="lab" element={<Lab />} />
        <Route path="library" element={<Library />} />
        <Route path="about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
