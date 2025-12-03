import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { enableLogging } from '@naylence/runtime'
import './index.css'
import App from './App.tsx'

// Enable logging before app starts
enableLogging('debug');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
