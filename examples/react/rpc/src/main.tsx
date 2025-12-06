import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { enableLogging } from '@naylence/runtime'
import { EnvelopeProvider } from './EnvelopeContext'
import './index.css'
import App from './App.tsx'

// Enable logging before app starts
enableLogging('debug');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <EnvelopeProvider>
      <App />
    </EnvelopeProvider>
  </StrictMode>,
)
