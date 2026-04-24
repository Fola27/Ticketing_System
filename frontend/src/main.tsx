import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './Home'
import UserPortal from './UserPortal'
import AdminPortal from './AdminPortal'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/user" element={<UserPortal />} />
        <Route path="/admin" element={<AdminPortal />} />
      </Routes>
    </Router>
  </React.StrictMode>
)
