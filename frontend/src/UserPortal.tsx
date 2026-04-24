import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import Header from './components/Header'
import Login from './components/Login'
import TicketForm from './components/TicketForm'
import TicketTable from './components/TicketTable'

// Setup axios interceptor to add auth token to all requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

export default function UserPortal() {
  const [user, setUser] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [quickPreset, setQuickPreset] = useState<{ description: string; priority: string } | null>(null)
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'))
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const userEmail = localStorage.getItem('userEmail')

    if (token && userEmail) {
      // Verify user token
      axios
        .post('http://localhost:4000/api/auth/verify', {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(() => {
          setUser(userEmail)
        })
        .catch(() => {
          localStorage.removeItem('authToken')
          localStorage.removeItem('userEmail')
          setLoading(false)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }

    const saved = localStorage.getItem('theme')
    if (saved === 'dark') {
      document.documentElement.classList.add('dark')
      setIsDark(true)
    }
  }, [])

  const handleLogin = (token: string, email: string) => {
    setUser(email)
  }

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark')
    const mode = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    setIsDark(mode === 'dark')
    localStorage.setItem('theme', mode)
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userEmail')
    window.location.href = '/'
  }

  const scrollToForm = () => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' })
      // Focus on the description field for better UX
      const textarea = formRef.current.querySelector('textarea')
      if (textarea) {
        setTimeout(() => textarea.focus(), 500)
      }
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (!user) {
    return (
      <div className="app-root">
        <Header 
          user={null}
          isAdminMode={false}
        />
        <main>
          <div className="login-mode-selector">
            <Login onLogin={handleLogin} />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app-root">
      <Header 
        user={user}
        onLogout={handleLogout}
        isAdminMode={false}
      />
      <main>
        <div className="dashboard-page">
          <section className="dashboard-top-panel">
            <div className="dashboard-welcome-card">
              <div>
                <p className="eyebrow">IT Service Desk</p>
                <h2>Welcome back, {user}!</h2>
                <p className="dashboard-intro">Submit, track, and manage your IT requests with zero friction.</p>
              </div>
              <button className="btn-primary" onClick={scrollToForm}>Create New Ticket</button>
            </div>

            <div className="dashboard-stats-grid">
              <div className="stat-card">
                <p className="stat-label">Tickets Open</p>
                <h3>12</h3>
              </div>
              <div className="stat-card">
                <p className="stat-label">In Progress</p>
                <h3>8</h3>
              </div>
              <div className="stat-card">
                <p className="stat-label">Completed</p>
                <h3>21</h3>
              </div>
              <div className="stat-card">
                <p className="stat-label">Average Response</p>
                <h3>1h 24m</h3>
              </div>
            </div>
          </section>

          <section className="dashboard-body">
            <div className="dashboard-left-panel">
              <div className="dashboard-panel quick-action-panel">
                <div className="panel-header">
                  <div>
                    <p className="panel-eyebrow">Quick Actions</p>
                    <h3>Common requests</h3>
                  </div>
                </div>
                <div className="quick-action-grid">
                  <button
                    type="button"
                    className="action-card action-primary"
                    onClick={() => setQuickPreset({ description: 'Please onboard a new team member with access to email, Teams, and shared drives.', priority: 'Medium' })}
                  >
                    Onboard new user
                  </button>
                  <button
                    type="button"
                    className="action-card action-secondary"
                    onClick={() => setQuickPreset({ description: 'Request access to the corporate VPN, shared project folders, and HR systems.', priority: 'High' })}
                  >
                    Request access
                  </button>
                  <button
                    type="button"
                    className="action-card action-tertiary"
                    onClick={() => setQuickPreset({ description: 'Install and configure the required operating system and standard productivity tools.', priority: 'Medium' })}
                  >
                    Setup OS
                  </button>
                </div>
              </div>

              <div className="dashboard-panel" ref={formRef}>
                <TicketForm reported_by={user} quickPreset={quickPreset} onPresetApplied={() => setQuickPreset(null)} />
              </div>
            </div>

            <div className="dashboard-right-panel">
              <TicketTable />
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}