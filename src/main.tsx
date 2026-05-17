import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// Disable console logs in production for security
if (import.meta.env.PROD) {
  console.log = () => {}
  console.warn = () => {}
  console.debug = () => {}
  // keep console.error for real errors only
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
