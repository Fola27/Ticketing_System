import React, { useState, useEffect } from 'react'
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

export default function App() {
  const [user, setUser] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Check if user is already logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const userEmail = localStorage.getItem('userEmail')
    
    if (token && userEmail) {
      // Verify token is still valid
      axios
        .post('http://localhost:4000/api/auth/verify', {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(() => {
          setUser(userEmail)
        })
        .catch(() => {
          // Token is invalid, clear storage
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
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userEmail')
    setUser(null)
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="app-root">
      {user && <Header user={user} onLogout={handleLogout} />}
      <main>
        {!user ? (
          <Login onLogin={handleLogin} />
        ) : (
          <div className="container">
            <TicketForm reported_by={user} />
            <TicketTable />
          </div>
        )}
      </main>
    </div>
  )
}
