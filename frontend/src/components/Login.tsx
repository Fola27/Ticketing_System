import React, { useState } from 'react'
import axios from 'axios'

interface LoginProps {
  onLogin: (token: string, email: string) => void
}

export default function Login({ onLogin }: LoginProps) {
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'))
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
      const payload = isLogin
        ? { email, password }
        : { email, password, name }

      const response = await axios.post(`http://localhost:4000${endpoint}`, payload)
      const { token, user } = response.data

      // Store token in localStorage
      localStorage.setItem('authToken', token)
      localStorage.setItem('userEmail', user.email)

      onLogin(token, user.email)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <button className="btn-theme-absolute" onClick={toggleTheme} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
        {isDark ? '☀️' : '🌙'}
      </button>
      <video className="login-video" autoPlay muted loop>
        <source src="/dark_office.mp4" type="video/mp4" />
      </video>
      <div className="login-overlay">
        <div className="login">
          <h1 className="welcome-heading">Welcome to the <span className="welcome-highlight">UPDC IT Service Desk</span></h1>
          <h2>{isLogin ? 'Sign in with your email and password' : 'Create your account'}</h2>
          
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
                disabled={loading}
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            
            {error && <div className="error-message">{error}</div>}
            
            <button type="submit" disabled={loading}>
              {loading ? 'Loading...' : (isLogin ? 'Sign in' : 'Create Account')}
            </button>
          </form>

          <div className="auth-toggle">
            <p>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError('')
                  setEmail('')
                  setPassword('')
                  setName('')
                }}
                className="toggle-link"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
