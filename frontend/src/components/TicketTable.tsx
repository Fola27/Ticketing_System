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
  'Date & time reported',
  'Associated files',
  'Closed Date',
]

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
    return <section className="ticket-table"><h2>Tickets</h2><p>Loading...</p></section>
  }

  return (
    <section className="ticket-table">
      <h2>Tickets</h2>
      <table>
        <thead>
          <tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.ticket_id}>
              <td>{t.ticket_id}</td>
              <td>{t.description}</td>
              <td>{t.priority}</td>
              <td>{t.reported_by}</td>
              <td>{t.tracker}</td>
              <td>{t.status}</td>
              <td>{t.assigned_to || ''}</td>
              <td>{t.reported_at}</td>
              <td>
                {(t.attachments || []).length}
                <div>
                  {(t.attachments || []).map((a: any) => (
                    <div key={a.url}><a href={a.url} target="_blank" rel="noreferrer">{a.filename}</a></div>
                  ))}
                </div>
              </td>
              <td>{t.closed_at || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
