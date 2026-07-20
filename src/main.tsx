import React from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.tsx'

import './index.css'

import './services/errorReportingService'

createRoot(document.getElementById('root')!).render(<App />)
