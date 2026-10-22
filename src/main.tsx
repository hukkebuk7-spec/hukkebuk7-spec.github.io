import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { MotionProvider } from './lib/motion'
import '@fontsource-variable/bricolage-grotesque'
import '@fontsource/dm-mono/400.css'
import '@fontsource/dm-mono/500.css'
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/ui.css'
import './styles/home.css'
import './styles/pages.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MotionProvider>
  </StrictMode>,
)
