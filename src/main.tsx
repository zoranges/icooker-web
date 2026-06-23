import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { ensureSeedData } from './utils/accounts'

ensureSeedData()

console.log('%c iCooker v2.0 %c 2026-06-22 11:35 %c 已更新',
  'background:#f97316;color:#fff;padding:2px 6px;border-radius:3px 0 0 3px;font-weight:bold',
  'background:#6d28d9;color:#fff;padding:2px 6px',
  'background:transparent;color:#666;padding:2px 6px')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
