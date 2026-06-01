import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter es el motor que permite leer las URLs y cambiar las pantallas */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)