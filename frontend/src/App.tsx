import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import Header from './components/Header'
import Login from './components/Login'
import AdminLogin from './components/AdminLogin'
import TicketForm from './components/TicketForm'
import TicketTable from './components/TicketTable'
import AdminDashboard from './components/AdminDashboard'

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

export default function App() {
  const [user, setUser] = useState<string | null>(null)
  const [admin, setAdmin] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [quickPreset, setQuickPreset] = useState<{ description: string; priority: string } | null>(null)
  const [isAdminMode, setIsAdminMode] = useState(false)
  const ticketFormRef = useRef<HTMLDivElement>(null)

  // Check if user or admin is already logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const userEmail = localStorage.getItem('userEmail')
    const adminToken = localStorage.getItem('adminToken')
    const adminUser = localStorage.getItem('adminUser')

    if (adminToken && adminUser) {
      // Verify admin token
      axios
        .post('http://localhost:4000/api/auth/verify', {}, {
          headers: { Authorization: `Bearer ${adminToken}` }
        })
        .then(() => {
          setAdmin(JSON.parse(adminUser))
          setIsAdminMode(true)
        })
        .catch(() => {
          localStorage.removeItem('adminToken')
          localStorage.removeItem('adminUser')
        })
        .finally(() => setLoading(false))
    } else if (token && userEmail) {
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
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogin = (token: string, email: string) => {
    setUser(email)
    setIsAdminMode(false)
  }

  const handleAdminLogin = (token: string, adminUser: any) => {
    setAdmin(adminUser)
    setIsAdminMode(true)
  }

  const handleSwitchToUser = () => {
    // Clear admin session and switch to user mode
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    setAdmin(null)
    setIsAdminMode(false)
  }

  const handleSwitchToAdmin = () => {
    // Clear user session and switch to admin mode
    localStorage.removeItem('authToken')
    localStorage.removeItem('userEmail')
    setUser(null)
    setIsAdminMode(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    setUser(null)
    setAdmin(null)
    setIsAdminMode(false)
  }

  const scrollToForm = () => {
    if (ticketFormRef.current) {
      ticketFormRef.current.scrollIntoView({ behavior: 'smooth' })
      const textarea = ticketFormRef.current.querySelector('textarea')
      if (textarea) {
        setTimeout(() => textarea.focus(), 500)
      }
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  const username = user ? user.split('@')[0] : 'Team Member'

  return (
    <div className="app-root">
      <Header 
        user={user || admin}
        onLogout={handleLogout}
        onSwitchToUser={admin ? handleSwitchToUser : undefined}
        onSwitchToAdmin={user ? handleSwitchToAdmin : undefined}
        onSelectUserPortal={!user && !admin ? () => setIsAdminMode(false) : undefined}
        onSelectAdminPortal={!user && !admin ? () => setIsAdminMode(true) : undefined}
        isAdminMode={isAdminMode}
      />
      <main>
        {!user && !admin ? (
          <div className="login-mode-selector">
            {isAdminMode ? (
              <AdminLogin onAdminLogin={handleAdminLogin} />
            ) : (
              <Login onLogin={handleLogin} />
            )}
          </div>
        ) : admin ? (
          <AdminDashboard admin={admin} onLogout={handleLogout} />
        ) : (
          <div className="dashboard-page">
            <section className="dashboard-top-panel">
              <div className="dashboard-welcome-card">
                <div>
                  <p className="eyebrow">IT Service Desk</p>
                  <h2>Welcome back, {username}!</h2>
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

                <div className="dashboard-panel" ref={ticketFormRef}>
                  <TicketForm reported_by={user as string} quickPreset={quickPreset} onPresetApplied={() => setQuickPreset(null)} />
                </div>
              </div>

              <div className="dashboard-right-panel">
                <TicketTable />
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
