import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import HelloWorld from './components/HelloWorld.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename="/testing-cursor">
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/hello" element={<HelloWorld />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
