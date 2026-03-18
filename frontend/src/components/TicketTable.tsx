import React, { useEffect, useState } from 'react'
import axios from 'axios'

const columns = [
  'Ticket ID',
  'Issue Description',
  'Priority',
  'Issue logged by',
  'Ticket Tracker',
  'Status',
  'Assigned to',
  'Date reported',
  'Associated files',
  'Closed Date',
]

const getStatusBadgeClass = (status: string) => {
  const statusLower = status?.toLowerCase() || ''
  if (statusLower.includes('completed') || statusLower.includes('closed')) return 'badge-completed'
  if (statusLower.includes('progress') || statusLower.includes('in progress')) return 'badge-in-progress'
  if (statusLower.includes('open')) return 'badge-open'
  return 'badge-default'
}

const getPriorityBadgeClass = (priority: string) => {
  const priorityLower = priority?.toLowerCase() || ''
  if (priorityLower.includes('high')) return 'priority-high'
  if (priorityLower.includes('medium')) return 'priority-medium'
  if (priorityLower.includes('low')) return 'priority-low'
  return 'priority-default'
}

export default function TicketTable() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
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
    load()

    // Refresh when tickets are updated
    const handleUpdate = () => load()
    window.addEventListener('ticketsUpdated', handleUpdate)

    return () => window.removeEventListener('ticketsUpdated', handleUpdate)
  }, [])

  if (loading) {
    return (
      <section className="ticket-table">
        <div className="ticket-table-header">
          <h2>Tickets</h2>
        </div>
        <div className="loading-spinner">Loading...</div>
      </section>
    )
  }

  return (
    <section className="ticket-table">
      <div className="ticket-table-header">
        <div className="header-left">
          <h2>Tickets</h2>
          <span className="ticket-count">{tickets.length} items</span>
        </div>
        <div className="header-right">
          <div className="view-controls">
            <button className="view-btn active">All Items</button>
          </div>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="modern-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c} className={`col-${c.toLowerCase().replace(/\s+/g, '-')}`}>
                  <span>{c}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.ticket_id} className="ticket-row">
                <td className="col-ticket-id">
                  <span className="ticket-id-badge">{t.ticket_id}</span>
                </td>
                <td className="col-issue-description">
                  <span className="issue-desc">{t.description}</span>
                </td>
                <td className="col-priority">
                  <span className={`priority-badge ${getPriorityBadgeClass(t.priority)}`}>
                    {t.priority}
                  </span>
                </td>
                <td className="col-issue-logged-by">
                  <span className="user-name">{t.reported_by}</span>
                </td>
                <td className="col-ticket-tracker">
                  <span className="tracker-name">{t.tracker || '-'}</span>
                </td>
                <td className="col-status">
                  <span className={`status-badge ${getStatusBadgeClass(t.status)}`}>
                    {t.status}
                  </span>
                </td>
                <td className="col-assigned-to">
                  <span className="assigned-user">{t.assigned_to || '-'}</span>
                </td>
                <td className="col-date-reported">
                  <span className="date">{new Date(t.reported_at).toLocaleDateString()}</span>
                </td>
                <td className="col-associated-files">
                  <span className="file-count">
                    {(t.attachments || []).length > 0 ? (
                      <a href="#files" title={`${(t.attachments || []).length} file(s)`}>
                        {(t.attachments || []).length}
                      </a>
                    ) : (
                      '-'
                    )}
                  </span>
                </td>
                <td className="col-closed-date">
                  <span className="date">{t.closed_at ? new Date(t.closed_at).toLocaleDateString() : '-'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
