import React, { useState } from 'react'

export default function Header({ user, onLogout }: { user?: string | null; onLogout?: () => void }) {
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'))

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark')
    const mode = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    setIsDark(mode === 'dark')
    localStorage.setItem('theme', mode)
  }

  React.useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') {
      document.documentElement.classList.add('dark')
      setIsDark(true)
    }
  }, [])

  return (
    <header className="app-header">
      <div className="brand">
        <img src="/assets/logo.svg" alt="UPDC logo" className="logo" />
        <h1>UPDC IT Helpdesk</h1>
      </div>
      <div className="header-actions">
        <button onClick={toggleTheme} className="btn-theme" title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
          {isDark ? '☀️' : '🌙'}
        </button>
        {user ? <button onClick={onLogout} className="btn">Logout</button> : null}
      </div>
    </header>
  )
}
