import React, { useState } from 'react'
import axios from 'axios'

export default function TicketForm({ reported_by }: { reported_by: string }) {
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [files, setFiles] = useState<FileList | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const form = new FormData()
      form.append('description', description)
      form.append('priority', priority)
      form.append('reported_by', reported_by)
      if (files) {
        Array.from(files).forEach((f) => form.append('attachments', f))
      }

      await axios.post('http://localhost:4000/api/tickets', form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setDescription('')
      setPriority('Medium')
      setFiles(null)
      // Optionally trigger a refresh of the ticket table
      window.dispatchEvent(new Event('ticketsUpdated'))
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit ticket')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="ticket-form">
      <h2>Log an issue</h2>
      <form onSubmit={submit}>
        <label>Issue Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} required disabled={loading} />

        <label>Priority</label>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} disabled={loading}>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
          <option>Critical</option>
        </select>

        <label>Attachments</label>
        <input type="file" multiple onChange={(e) => setFiles(e.target.files)} disabled={loading} />

        {error && <div className="error-message">{error}</div>}

        <button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit Ticket'}</button>
      </form>
    </section>
  )
}
