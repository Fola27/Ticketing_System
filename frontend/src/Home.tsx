import React, { useState, useEffect } from 'react'

export default function Home() {
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark')
  })

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') {
      document.documentElement.classList.add('dark')
      setIsDark(true)
    } else {
      document.documentElement.classList.remove('dark')
      setIsDark(false)
    }
  }, [])

  const toggleTheme = () => {
    const isDarkMode = document.documentElement.classList.toggle('dark')
    setIsDark(isDarkMode)
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light')
  }

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="brand">
          <img src="/assets/logo.svg" alt="UPDC logo" className="logo" />
          <h1>UPDC IT Helpdesk</h1>
        </div>
        <div className="header-actions">
          <button type="button" onClick={toggleTheme} className="btn-theme" title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </header>
      <main>
        <div className="portal-selection">
          <div className="portal-selection-content">
            <h2>Welcome to UPDC IT Helpdesk</h2>
            <p>Please select your portal to continue:</p>
            <div className="portal-buttons">
              <div
                className="portal-btn user-portal-btn"
                onClick={() => {
                  window.location.href = '/user';
                }}
                style={{ cursor: 'pointer' }}
              >
                <h3>User Portal</h3>
                <p>Submit and track IT support tickets</p>
              </div>
              <div
                className="portal-btn admin-portal-btn"
                onClick={() => {
                  window.location.href = '/admin';
                }}
                style={{ cursor: 'pointer' }}
              >
                <h3>Admin Portal</h3>
                <p>Manage tickets and system administration</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}