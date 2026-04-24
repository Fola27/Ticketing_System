import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Header from './components/Header'
import AdminLogin from './components/AdminLogin'
import AdminDashboard from './components/AdminDashboard'

// Setup axios interceptor to add auth token to all requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

export default function AdminPortal() {
  const [admin, setAdmin] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'))

  useEffect(() => {
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
        })
        .catch(() => {
          localStorage.removeItem('adminToken')
          localStorage.removeItem('adminUser')
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

  const handleAdminLogin = (token: string, adminUser: any) => {
    setAdmin(adminUser)
  }

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark')
    const mode = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    setIsDark(mode === 'dark')
    localStorage.setItem('theme', mode)
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    window.location.href = '/'
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (!admin) {
    return (
      <div className="app-root">
        <Header 
          user={null}
          onSelectUserPortal={() => window.location.href = '/'}
          onSelectAdminPortal={() => {}}
          isAdminMode={true}
        />
        <main>
          <div className="login-mode-selector">
            <AdminLogin onAdminLogin={handleAdminLogin} />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app-root">
      <Header 
        user={admin?.email}
        onLogout={handleLogout}
        onSwitchToUser={() => window.location.href = '/'}
        isAdminMode={true}
      />
      <main>
        <AdminDashboard admin={admin} onLogout={handleLogout} />
      </main>
    </div>
  )
}