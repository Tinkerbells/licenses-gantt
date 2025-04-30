import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@tinkerbells/xenon-ui/styles.css'
import '@tinkerbells/xenon-charts/styles.css'

import App from './app.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
