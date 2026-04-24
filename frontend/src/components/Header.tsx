import React, { useState, useEffect, useRef } from 'react'

interface UserProfile {
  email?: string
  avatar?: string
  status?: 'Online' | 'Away' | 'Offline' | 'On-leave' | 'Available'
}

export default function Header({ user, onLogout, onSwitchToUser, onSwitchToAdmin, onSelectUserPortal, onSelectAdminPortal, isAdminMode }: { 
  user?: string | null; 
  onLogout?: () => void;
  onSwitchToUser?: () => void;
  onSwitchToAdmin?: () => void;
  onSelectUserPortal?: () => void;
  onSelectAdminPortal?: () => void;
  isAdminMode?: boolean;
}) {
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'))
  const [userProfile, setUserProfile] = useState<UserProfile>({})
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [userStatus, setUserStatus] = useState<'Online' | 'Away' | 'Offline' | 'On-leave' | 'Available'>('Available')
  const dropdownRef = useRef<HTMLDivElement>(null)

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

    // Load user profile from localStorage
    if (user) {
      const savedProfile = localStorage.getItem(`userProfile_${user}`)
      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile))
      } else {
        setUserProfile({ email: user })
      }
      
      const savedStatus = localStorage.getItem(`userStatus_${user}`)
      if (savedStatus) {
        setUserStatus(savedStatus as any)
      }
    }
  }, [user])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && user) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const avatarData = event.target?.result as string
        const updatedProfile = { ...userProfile, avatar: avatarData, email: user }
        setUserProfile(updatedProfile)
        localStorage.setItem(`userProfile_${user}`, JSON.stringify(updatedProfile))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleStatusChange = (newStatus: 'Online' | 'Away' | 'Offline' | 'On-leave' | 'Available') => {
    setUserStatus(newStatus)
    if (user) {
      localStorage.setItem(`userStatus_${user}`, newStatus)
    }
    setShowProfileDropdown(false)
  }

  const getAvatarInitials = (email: string) => {
    return email.charAt(0).toUpperCase()
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Online': return '#10b981'
      case 'Away': return '#f59e0b'
      case 'Offline': return '#6b7280'
      case 'On-leave': return '#ef4444'
      case 'Available': return '#3b82f6'
      default: return '#3b82f6'
    }
  }

  return (
    <header className="app-header">
      <div className="brand">
        <img src="/assets/logo.svg" alt="UPDC logo" className="logo" />
        <h1>UPDC IT Service Desk</h1>
      </div>
      <div className="header-actions">
        {/* Portal selector buttons when not logged in */}
        {/* {!user && onSelectUserPortal && onSelectAdminPortal && (
          <div className="mode-buttons-header">
            <button 
              type="button" 
              onClick={onSelectUserPortal} 
              className={`mode-btn ${!isAdminMode ? 'active' : ''}`}
            >
              User Portal
            </button>
            <button 
              type="button" 
              onClick={onSelectAdminPortal} 
              className={`mode-btn ${isAdminMode ? 'active' : ''}`}
            >
              Admin Portal
            </button>
          </div>
        )}
        {onSwitchToUser && (
          <button type="button" onClick={onSwitchToUser} className="btn-portal">
            User Portal
          </button>
        )} */}
        
        <button type="button" onClick={toggleTheme} className="btn-theme" title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
          {isDark ? '☀️' : '🌙'}
        </button>

        {/* User Avatar and Profile Dropdown */}
        {user && (
          <div className="user-profile-section" ref={dropdownRef}>
            <button 
              className="avatar-button"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              title={`Status: ${userStatus}`}
            >
              <div className="avatar-frame">
                {userProfile.avatar ? (
                  <img src={userProfile.avatar} alt="User avatar" className="avatar-image" />
                ) : (
                  <div className="avatar-initials">{getAvatarInitials(user)}</div>
                )}
                <div className="status-indicator" style={{ backgroundColor: getStatusColor(userStatus) }}></div>
              </div>
            </button>

            {showProfileDropdown && (
              <div className="profile-dropdown">
                <div className="dropdown-header">
                  <div className="dropdown-user-info">
                    <strong>{user.split('@')[0]}</strong>
                    <small>{user}</small>
                  </div>
                </div>

                <div className="dropdown-divider"></div>

                <div className="dropdown-section">
                  <div className="dropdown-section-title">Profile</div>
                  <button 
                    className="dropdown-item"
                    onClick={() => {
                      alert('Profile page would open here')
                      setShowProfileDropdown(false)
                    }}
                  >
                    👤 View Profile
                  </button>
                  <label className="dropdown-item file-upload-item">
                    📸 Change Photo
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleAvatarUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                <div className="dropdown-divider"></div>

                <div className="dropdown-section">
                  <div className="dropdown-section-title">Status</div>
                  {(['Available', 'Away', 'Offline', 'On-leave'] as const).map((status) => (
                    <button
                      key={status}
                      className={`dropdown-item status-item ${userStatus === status ? 'active' : ''}`}
                      onClick={() => handleStatusChange(status)}
                    >
                      <span className="status-dot" style={{ backgroundColor: getStatusColor(status) }}></span>
                      {status}
                    </button>
                  ))}
                </div>

                <div className="dropdown-divider"></div>

                <div className="dropdown-section">
                  <button 
                    className="dropdown-item settings-item"
                    onClick={() => {
                      alert('Settings page would open here')
                      setShowProfileDropdown(false)
                    }}
                  >
                    ⚙️ Settings
                  </button>
                </div>

                <div className="dropdown-divider"></div>

                <button 
                  onClick={() => {
                    onLogout?.()
                    setShowProfileDropdown(false)
                  }} 
                  className="dropdown-item logout-item"
                >
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>
        )}

        {!user && onLogout && <button onClick={onLogout} className="btn">Logout</button>}
      </div>
    </header>
  )
}
