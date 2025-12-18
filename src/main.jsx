import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import FormPage from './pages/FormPage.jsx'
import HelloWorld from './pages/hello/HelloWorld.jsx'
import CounterpartyFilter from './pages/counterpartyfilter/CounterpartyFilter.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/form" element={<FormPage />} />
        <Route path="/hello" element={<HelloWorld />} />
        <Route path="/counterpartyfilter" element={<CounterpartyFilter />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
)
