import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { Footer, Header } from './components/Chrome'
import { Home } from './pages/Home'
import { NotFound } from './pages/NotFound'

const Lab = lazy(() => import('./pages/Lab').then((module) => ({ default: module.Lab })))
const Library = lazy(() => import('./pages/Library').then((module) => ({ default: module.Library })))
const About = lazy(() => import('./pages/About').then((module) => ({ default: module.About })))

function Layout() {
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const firstRender = useRef(true)
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    if (location.hash) {
      const target = document.querySelector<HTMLElement>(location.hash)
      if (target) {
        window.requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }))
      }
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }

    if (firstRender.current) {
      firstRender.current = false
      return
    }

    mainRef.current?.focus({ preventScroll: true })
    const timeout = window.setTimeout(() => setAnnouncement(document.title), 150)
    return () => window.clearTimeout(timeout)
  }, [location.pathname, location.hash])

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
