import React, { useState, useEffect } from 'react'
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
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')
  const [forgotSuccess, setForgotSuccess] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showResetForm, setShowResetForm] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetSuccess, setResetSuccess] = useState('')

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark')
    const mode = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    setIsDark(mode === 'dark')
    localStorage.setItem('theme', mode)
  }

  useEffect(() => {
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

      // Show success alert
      if (isLogin) {
        window.alert(`Welcome back! You have successfully logged in as ${user.email}`)
      } else {
        window.alert(`Account created successfully! Welcome ${name}, you can now log in.`)
      }

      onLogin(token, user.email)
      // Redirect to user portal
      window.location.href = '/user'
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotError('')
    setForgotSuccess('')
    setForgotLoading(true)

    try {
      const response = await axios.post(`http://localhost:4000/api/auth/forgot-password`, {
        email: forgotEmail,
      })
      setForgotSuccess(response.data.message)
      setResetToken(response.data.resetToken || '')
      // Show form to enter reset token and new password
      setTimeout(() => setShowResetForm(true), 1500)
    } catch (err: any) {
      setForgotError(err.response?.data?.error || 'Failed to process forgot password request')
    } finally {
      setForgotLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetError('')
    setResetSuccess('')
    setResetLoading(true)

    try {
      const response = await axios.post(`http://localhost:4000/api/auth/reset-password`, {
        resetToken: resetToken,
        newPassword: newPassword,
      })
      setResetSuccess(response.data.message)
      window.alert('Password reset successfully! You can now log in with your new password.')
      // Reset form
      setShowForgotPassword(false)
      setShowResetForm(false)
      setForgotEmail('')
      setResetToken('')
      setNewPassword('')
    } catch (err: any) {
      setResetError(err.response?.data?.error || 'Failed to reset password')
    } finally {
      setResetLoading(false)
    }
  }

  const closeForgotPassword = () => {
    setShowForgotPassword(false)
    setShowResetForm(false)
    setForgotEmail('')
    setResetToken('')
    setNewPassword('')
    setForgotError('')
    setForgotSuccess('')
    setResetError('')
    setResetSuccess('')
  }

  return (
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

        {isLogin && (
          <div className="forgot-password-wrapper">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="forgot-password-btn"
            >
              Forgot Password?
            </button>
          </div>
        )}
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

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="modal-overlay" onClick={closeForgotPassword}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeForgotPassword}></button>
            
            {!showResetForm ? (
              <>
                <h2>Reset Your Password</h2>
                <p className="modal-description">Enter your email address and we'll send you a reset link.</p>
                
                <form onSubmit={handleForgotPassword}>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    disabled={forgotLoading}
                    className="modal-input"
                  />
                  
                  {forgotError && <div className="error-message">{forgotError}</div>}
                  {forgotSuccess && <div className="success-message">{forgotSuccess}</div>}
                  
                  <button 
                    type="submit" 
                    disabled={forgotLoading}
                    className="modal-button"
                  >
                    {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2>Reset Password</h2>
                <p className="modal-description">Enter your reset token and new password.</p>
                
                <form onSubmit={handleResetPassword}>
                  <input
                    type="text"
                    placeholder="Enter reset token"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    required
                    disabled={resetLoading}
                    className="modal-input"
                  />
                  
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={resetLoading}
                    className="modal-input"
                  />
                  
                  {resetError && <div className="error-message">{resetError}</div>}
                  {resetSuccess && <div className="success-message">{resetSuccess}</div>}
                  
                  <button 
                    type="submit" 
                    disabled={resetLoading}
                    className="modal-button"
                  >
                    {resetLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

