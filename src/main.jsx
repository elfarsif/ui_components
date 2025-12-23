import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import FormPage from './pages/FormPage.jsx'
import HelloWorld from './pages/hello/HelloWorld.jsx'
import CounterpartyFilter from './pages/counterpartyfilter/CounterpartyFilter.jsx'
import CounterpartyList from './pages/counterpartylist/CounterpartyList.jsx'
import CounterpartyListExtended from './pages/counterpartylistextended/CounterpartyListExtended.jsx'
import CounterpartyFilter2 from './pages/counterpartyfilter2/CounterpartyFilter2.jsx'
import SidePanel from './pages/sidepanel/SidePanel.jsx'
import FormPage_Add from './pages/FormPage_Add.jsx'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/form" element={<FormPage />} />
        <Route path="/hello" element={<HelloWorld />} />
        <Route path="/counterpartyfilter" element={<CounterpartyFilter />} />
        <Route path="/counterpartyfilter2" element={<CounterpartyFilter2 />} />
        <Route path="/counterpartylist" element={<CounterpartyList />} />
        <Route path="/counterpartylistextended" element={<CounterpartyListExtended />} />
        <Route path="/side-panel" element={<SidePanel />} />
        <Route path="/form-add" element={<FormPage_Add />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
)
