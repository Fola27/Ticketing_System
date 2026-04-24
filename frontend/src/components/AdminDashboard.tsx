import React, { useEffect, useState } from 'react'
import axios from 'axios'

interface AdminDashboardProps {
  admin: any
  onLogout: () => void
}

interface Ticket {
  ticket_id: string
  description: string
  priority: string
  reported_by: string
  status: string
  assigned_to: string | null
  assigned_username: string | null
  escalation_level: string
  progress_level: string
  reported_at: string
  closed_at: string | null
  status_history: Array<{
    status: string
    timestamp: string
    updated_by: string
    resolution?: string
  }>
  progress_history: Array<{
    level: string
    timestamp: string
    updated_by: string
    reason?: string
  }>
}

export default function AdminDashboard({ admin, onLogout }: AdminDashboardProps) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [filter, setFilter] = useState('all')
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'))
  const [userProfile, setUserProfile] = useState<any>({})
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [userStatus, setUserStatus] = useState<'Online' | 'Away' | 'Offline' | 'On-leave' | 'Available'>('Available')

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark')
    const mode = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    setIsDark(mode === 'dark')
    localStorage.setItem('theme', mode)
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && admin?.email) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const avatarData = event.target?.result as string
        const updatedProfile = { ...userProfile, avatar: avatarData, email: admin.email }
        setUserProfile(updatedProfile)
        localStorage.setItem(`userProfile_${admin.email}`, JSON.stringify(updatedProfile))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleStatusChange = (newStatus: 'Online' | 'Away' | 'Offline' | 'On-leave' | 'Available') => {
    setUserStatus(newStatus)
    if (admin?.email) {
      localStorage.setItem(`userStatus_${admin.email}`, newStatus)
    }
    setShowProfileDropdown(false)
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

  const getAvatarInitials = (email: string) => {
    return email.charAt(0).toUpperCase()
  }

  const loadTickets = async () => {
    try {
      setLoading(true)
      const response = await axios.get('http://localhost:4000/api/tickets')
      setTickets(response.data)
    } catch (err) {
      console.error('Failed to load tickets:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTickets()
    // Load admin profile from localStorage
    if (admin?.email) {
      const savedProfile = localStorage.getItem(`userProfile_${admin.email}`)
      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile))
      } else {
        setUserProfile({ email: admin.email })
      }
      const savedStatus = localStorage.getItem(`userStatus_${admin.email}`)
      if (savedStatus) {
        setUserStatus(savedStatus as any)
      }
    }
  }, [])

  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'all') return true
    if (filter === 'open') return ticket.status === 'Open'
    if (filter === 'in-progress') return ticket.status === 'In Progress'
    if (filter === 'completed') return ticket.status === 'Completed'
    if (filter === 'escalated') return ticket.escalation_level !== 'first-level'
    return true
  })

  const handleAssign = async (ticketId: string, assignedTo: string, assignedUsername: string) => {
    try {
      const ticket = tickets.find(t => t.ticket_id === ticketId)
      await axios.post(`http://localhost:4000/api/tickets/${ticketId}/assign`, {
        assigned_to: assignedTo,
        assigned_username: assignedUsername
      })
      
      // Show success notification
      alert(`✓ Ticket successfully assigned to ${assignedUsername}`)
      
      // Notify the user who logged the request
      if (ticket) {
        try {
          await axios.post('http://localhost:4000/api/tickets/notify', {
            email: ticket.reported_by,
            subject: `Your ticket #${ticketId} has been assigned`,
            message: `Your ticket has been assigned to ${assignedUsername} for support.`
          })
        } catch (err) {
          console.error('Failed to notify user:', err)
        }
      }
      
      loadTickets()
    } catch (err) {
      console.error('Failed to assign ticket:', err)
      alert('Failed to assign ticket. Please try again.')
    }
  }

  const handleEscalate = async (ticketId: string, level: string, reason: string) => {
    try {
      const ticket = tickets.find(t => t.ticket_id === ticketId)
      await axios.post(`http://localhost:4000/api/tickets/${ticketId}/escalate`, {
        escalation_level: level,
        reason
      })
      
      // Show success notification
      alert(`✓ Ticket escalated to ${level}`)
      
      // Notify the user who logged the request
      if (ticket) {
        try {
          await axios.post('http://localhost:4000/api/tickets/notify', {
            email: ticket.reported_by,
            subject: `Your ticket #${ticketId} has been escalated`,
            message: `Your ticket has been escalated to ${level} support. Reason: ${reason}`
          })
        } catch (err) {
          console.error('Failed to notify user:', err)
        }
      }
      
      loadTickets()
    } catch (err) {
      console.error('Failed to escalate ticket:', err)
      alert('Failed to escalate ticket. Please try again.')
    }
  }

  const handleResolve = async (ticketId: string, resolution: string) => {
    try {
      const ticket = tickets.find(t => t.ticket_id === ticketId)
      await axios.post(`http://localhost:4000/api/tickets/${ticketId}/resolve`, {
        resolution
      })
      
      // Show success notification
      alert(`✓ Ticket marked as resolved`)
      
      // Notify the user who logged the request
      if (ticket) {
        try {
          await axios.post('http://localhost:4000/api/tickets/notify', {
            email: ticket.reported_by,
            subject: `Your ticket #${ticketId} has been resolved`,
            message: `Your ticket has been marked as resolved. Resolution: ${resolution}`
          })
        } catch (err) {
          console.error('Failed to notify user:', err)
        }
      }
      
      loadTickets()
    } catch (err) {
      console.error('Failed to resolve ticket:', err)
      alert('Failed to resolve ticket. Please try again.')
    }
  }

  const updateProgress = async (ticketId: string, level: string) => {
    try {
      const response = await axios.patch(`http://localhost:4000/api/tickets/${ticketId}`, {
        progress_level: level
      })
      // Update the selected ticket immediately
      if (selectedTicket && selectedTicket.ticket_id === ticketId) {
        setSelectedTicket({ ...selectedTicket, progress_level: level })
      }
      loadTickets()
      alert(`✓ Progress level updated to ${level}`)
    } catch (err) {
      console.error('Failed to update progress:', err)
      alert('Failed to update progress level')
    }
  }

  const getStatusBadgeClass = (status: string) => {
    const statusLower = status?.toLowerCase() || ''
    if (statusLower.includes('completed')) return 'badge-completed'
    if (statusLower.includes('progress')) return 'badge-in-progress'
    if (statusLower.includes('open')) return 'badge-open'
    return 'badge-default'
  }

  const getPriorityBadgeClass = (priority: string) => {
    const priorityLower = priority?.toLowerCase() || ''
    if (priorityLower.includes('high') || priorityLower.includes('critical')) return 'priority-high'
    if (priorityLower.includes('medium')) return 'priority-medium'
    if (priorityLower.includes('low')) return 'priority-low'
    return 'priority-default'
  }

  const getProgressBadgeClass = (level: string) => {
    const levelLower = level?.toLowerCase() || ''
    if (levelLower.includes('completed')) return 'progress-high'
    if (levelLower.includes('in-progress')) return 'progress-medium'
    if (levelLower.includes('open')) return 'progress-low'
    return 'progress-default'
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-spinner">Loading tickets...</div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-brand">
          <h1>IT Admin Portal</h1>
          <span className="admin-user">Welcome, {admin.name}</span>
        </div>
        <div className="admin-actions">
          <button onClick={toggleTheme} className="btn-theme" title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
            {isDark ? '☀️' : '🌙'}
          </button>

          <div className="user-profile-section">
            <button 
              className="avatar-button"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              title={`Status: ${userStatus}`}
            >
              <div className="avatar-frame">
                {userProfile.avatar ? (
                  <img src={userProfile.avatar} alt="Admin avatar" className="avatar-image" />
                ) : (
                  <div className="avatar-initials">{getAvatarInitials(admin?.email || 'A')}</div>
                )}
                <div className="status-indicator" style={{ backgroundColor: getStatusColor(userStatus) }}></div>
              </div>
            </button>

            {showProfileDropdown && (
              <div className="profile-dropdown">
                <div className="dropdown-header">
                  <div className="dropdown-user-info">
                    <strong>{admin?.name || 'Admin'}</strong>
                    <small>{admin?.email}</small>
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
                    onLogout()
                    setShowProfileDropdown(false)
                  }} 
                  className="dropdown-item logout-item"
                >
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="admin-content">
        <div className="admin-sidebar">
          <div className="filter-section">
            <h3>Filters</h3>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All Tickets ({tickets.length})
              </button>
              <button
                className={`filter-btn ${filter === 'open' ? 'active' : ''}`}
                onClick={() => setFilter('open')}
              >
                Open ({tickets.filter(t => t.status === 'Open').length})
              </button>
              <button
                className={`filter-btn ${filter === 'in-progress' ? 'active' : ''}`}
                onClick={() => setFilter('in-progress')}
              >
                In Progress ({tickets.filter(t => t.status === 'In Progress').length})
              </button>
              <button
                className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                onClick={() => setFilter('completed')}
              >
                Completed ({tickets.filter(t => t.status === 'Completed').length})
              </button>
              <button
                className={`filter-btn ${filter === 'escalated' ? 'active' : ''}`}
                onClick={() => setFilter('escalated')}
              >
                Escalated ({tickets.filter(t => t.escalation_level !== 'first-level').length})
              </button>
            </div>
          </div>
        </div>

        <div className="admin-main">
          <div className="tickets-header">
            <h2>{filter === 'all' ? 'All Tickets' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Tickets`}</h2>
            <div className="tickets-count">{filteredTickets.length} tickets</div>
          </div>

          <div className="tickets-grid">
            {filteredTickets.map((ticket) => (
              <div key={ticket.ticket_id} className="ticket-card" onClick={() => setSelectedTicket(ticket)}>
                <div className="ticket-card-header">
                  <div className="ticket-id">#{ticket.ticket_id}</div>
                  <div className="ticket-badges">
                    <span className={`status-badge ${getStatusBadgeClass(ticket.status)}`}>
                      {ticket.status}
                    </span>
                    <span className={`priority-badge ${getPriorityBadgeClass(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                    <span className={`progress-badge ${getProgressBadgeClass(ticket.progress_level)}`}>
                      {ticket.progress_level}
                    </span>
                  </div>
                </div>

                <div className="ticket-description">
                  {ticket.description.length > 100
                    ? `${ticket.description.substring(0, 100)}...`
                    : ticket.description
                  }
                </div>

                <div className="ticket-meta">
                  <div className="meta-item">
                    <span className="meta-label">Reported by:</span>
                    <span className="meta-value">{ticket.reported_by}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Assigned to:</span>
                    <span className="meta-value">{ticket.assigned_username || 'Unassigned'}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Escalation:</span>
                    <span className="meta-value">{ticket.escalation_level}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Reported:</span>
                    <span className="meta-value">{new Date(ticket.reported_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedTicket && (
        <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="modal-content admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Ticket #{selectedTicket.ticket_id}</h3>
              <button className="modal-close" onClick={() => setSelectedTicket(null)}>×</button>
            </div>

            <div className="modal-body">
              <div className="ticket-details">
                <div className="detail-section">
                  <h4>Reporter Information</h4>
                  <p><strong>Reported by:</strong> {selectedTicket.reported_by}</p>
                </div>

                <div className="detail-section">
                  <h4>Description</h4>
                  <p>{selectedTicket.description}</p>
                </div>

                <div className="detail-section">
                  <h4>Status & Assignment</h4>
                  <div className="status-grid">
                    <div>
                      <label>Status:</label>
                      <span className={`status-badge ${getStatusBadgeClass(selectedTicket.status)}`}>
                        {selectedTicket.status}
                      </span>
                    </div>
                    <div>
                      <label>Priority:</label>
                      <span className={`priority-badge ${getPriorityBadgeClass(selectedTicket.priority)}`}>
                        {selectedTicket.priority}
                      </span>
                    </div>
                    <div>
                      <label>Progress:</label>
                      <select
                        value={selectedTicket.progress_level}
                        onChange={(e) => updateProgress(selectedTicket.ticket_id, e.target.value)}
                      >
                        <option value="Open">Open</option>
                        <option value="In-Progress">In-Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                    <div>
                      <label>Escalation Level:</label>
                      <span>{selectedTicket.escalation_level}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Assignment</h4>
                  {selectedTicket.assigned_username ? (
                    <p>Assigned to: {selectedTicket.assigned_username}</p>
                  ) : (
                    <div className="assign-form">
                      <input
                        type="email"
                        placeholder="Assign to email"
                        id={`assign-email-${selectedTicket.ticket_id}`}
                      />
                      <input
                        type="text"
                        placeholder="Assignee name"
                        id={`assign-name-${selectedTicket.ticket_id}`}
                      />
                      <button
                        onClick={() => {
                          const email = (document.getElementById(`assign-email-${selectedTicket.ticket_id}`) as HTMLInputElement).value
                          const name = (document.getElementById(`assign-name-${selectedTicket.ticket_id}`) as HTMLInputElement).value
                          if (email && name) {
                            handleAssign(selectedTicket.ticket_id, email, name)
                            setSelectedTicket(null)
                          }
                        }}
                      >
                        Assign
                      </button>
                    </div>
                  )}
                </div>

                <div className="detail-section">
                  <h4>Actions</h4>
                  <div className="action-buttons">
                    {selectedTicket.status !== 'Completed' && (
                      <>
                        <button
                          className="btn-escalate"
                          onClick={() => {
                            const level = selectedTicket.escalation_level === 'first-level' ? 'second-level' : 'high-level'
                            const reason = prompt('Reason for escalation:')
                            if (reason) {
                              handleEscalate(selectedTicket.ticket_id, level, reason)
                              setSelectedTicket(null)
                            }
                          }}
                        >
                          Escalate to {selectedTicket.escalation_level === 'first-level' ? 'Second' : 'High'} Level
                        </button>
                        <button
                          className="btn-resolve"
                          onClick={() => {
                            const resolution = prompt('Resolution details:')
                            if (resolution) {
                              handleResolve(selectedTicket.ticket_id, resolution)
                              setSelectedTicket(null)
                            }
                          }}
                        >
                          Mark as Resolved
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="detail-section">
                  <h4>History</h4>
                  <div className="history-timeline">
                    {selectedTicket.status_history?.map((entry, index) => (
                      <div key={index} className="history-entry">
                        <div className="history-time">{new Date(entry.timestamp).toLocaleString()}</div>
                        <div className="history-action">
                          Status changed to <strong>{entry.status}</strong> by {entry.updated_by}
                          {entry.resolution && <div className="history-resolution">Resolution: {entry.resolution}</div>}
                        </div>
                      </div>
                    ))}
                    {selectedTicket.progress_history?.map((entry, index) => (
                      <div key={`progress-${index}`} className="history-entry">
                        <div className="history-time">{new Date(entry.timestamp).toLocaleString()}</div>
                        <div className="history-action">
                          Progress level changed to <strong>{entry.level}</strong> by {entry.updated_by}
                          {entry.reason && <div className="history-reason">Reason: {entry.reason}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}