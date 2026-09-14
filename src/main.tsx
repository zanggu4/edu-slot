import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/global.css'
import App from './App'
import { seedRng, useGame } from './store/gameStore'

if (import.meta.env.DEV) {
  ;(window as unknown as { __slot: unknown }).__slot = { seedRng, useGame }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
