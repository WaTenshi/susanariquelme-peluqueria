import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/cormorant-garamond/latin-500.css'
import '@fontsource/cormorant-garamond/latin-600.css'
import '@fontsource/manrope/latin-400.css'
import '@fontsource/manrope/latin-500.css'
import '@fontsource/manrope/latin-600.css'
import '@fontsource/manrope/latin-700.css'
import './index.css'
import App from './App.tsx'

const root = document.getElementById('root')

if (!root) {
  throw new Error('No se encontró el contenedor principal del sitio.')
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
