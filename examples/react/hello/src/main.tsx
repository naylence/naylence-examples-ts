import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { EnvelopeProvider } from './EnvelopeContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <EnvelopeProvider>
      <App />
    </EnvelopeProvider>
  </StrictMode>
)
