import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { InsforgeProvider } from '@insforge/react'
import { insforge } from './lib/insforge'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <InsforgeProvider client={insforge}>
      <App />
    </InsforgeProvider>
  </StrictMode>,
)
