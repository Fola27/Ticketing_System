 import React, { useEffect, useState } from 'react'
import axios from 'axios'

interface TicketFormProps {
  reported_by: string
  quickPreset?: { description: string; priority: string } | null
  onPresetApplied?: () => void
}

export default function TicketForm({ reported_by, quickPreset, onPresetApplied }: TicketFormProps) {
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [files, setFiles] = useState<FileList | null>(null)
  const [fileNames, setFileNames] = useState<string[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (quickPreset) {
      setDescription(quickPreset.description)
      setPriority(quickPreset.priority)
      onPresetApplied?.()
    }
  }, [quickPreset, onPresetApplied])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
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
      setFileNames([])
      setSuccess('Ticket submitted successfully!')
      // Optionally trigger a refresh of the ticket table
      window.dispatchEvent(new Event('ticketsUpdated'))
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit ticket')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    setFiles(selectedFiles)
    if (selectedFiles) {
      setFileNames(Array.from(selectedFiles).map(f => f.name))
    } else {
      setFileNames([])
    }
  }

  const removeFile = (index: number) => {
    const dataTransfer = new DataTransfer()
    if (files) {
      Array.from(files).forEach((file, i) => {
        if (i !== index) {
          dataTransfer.items.add(file)
        }
      })
    }
    setFiles(dataTransfer.files)
    setFileNames(fileNames.filter((_, i) => i !== index))
  }

  const getPriorityIcon = (priority: string) => {
    const priorityLower = priority?.toLowerCase() || ''
    if (priorityLower.includes('high') || priorityLower.includes('critical')) return '⚠️'
    if (priorityLower.includes('medium')) return '📋'
    return 'ℹ️'
  }

  return (
    <section className="ticket-form">
      <div className="form-header">
        <div className="form-title-section">
          <h2>Report an Issue</h2>
          <p className="form-subtitle">Create a new support ticket</p>
        </div>
      </div>

      <form onSubmit={submit} className="modern-form">
        {/* Description Field */}
        <div className="form-group">
          <label htmlFor="description" className="form-label">
            <span className="label-text">Issue Description</span>
            <span className="label-required">*</span>
          </label>
          <textarea
            id="description"
            className="form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue you're experiencing..."
            required
            disabled={loading}
            rows={6}
          />
          <span className="char-count">{description.length} characters</span>
        </div>

        {/* Priority Field */}
        <div className="form-group">
          <label htmlFor="priority" className="form-label">
            <span className="label-text">Priority Level</span>
            <span className="label-required">*</span>
          </label>
          <div className="priority-selector">
            <select
              id="priority"
              className="form-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              disabled={loading}
            >
              <option value="Low">🟢 Low</option>
              <option value="Medium">🟡 Medium</option>
              <option value="High">🔴 High</option>
              <option value="Critical">🚨 Critical</option>
            </select>
            <span className="priority-icon">{getPriorityIcon(priority)}</span>
          </div>
          <p className="priority-hint">Select the urgency level of your issue</p>
        </div>

        {/* Attachments Field */}
        <div className="form-group">
          <label htmlFor="attachments" className="form-label">
            <span className="label-text">Attachments</span>
            <span className="label-optional">(Optional)</span>
          </label>
          
          <div className="file-upload-wrapper">
            <input
              id="attachments"
              type="file"
              multiple
              onChange={handleFileChange}
              disabled={loading}
              className="file-input"
              accept="*"
            />
            <label htmlFor="attachments" className="file-upload-label">
              <div className="file-upload-icon">📎</div>
              <div className="file-upload-text">
                <span className="file-upload-main">Click to upload files</span>
                <span className="file-upload-sub">or drag and drop</span>
              </div>
            </label>
          </div>

          {/* File List */}
          {fileNames.length > 0 && (
            <div className="file-list">
              <div className="file-list-header">
                <span className="file-count-badge">{fileNames.length} file(s) selected</span>
              </div>
              <ul className="file-items">
                {fileNames.map((fileName, index) => (
                  <li key={index} className="file-item">
                    <span className="file-name">
                      <span className="file-icon">📄</span>
                      {fileName}
                    </span>
                    <button
                      type="button"
                      className="file-remove-btn"
                      onClick={() => removeFile(index)}
                      disabled={loading}
                      title="Remove file"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div className="message-container error-message-box">
            <span className="message-icon">❌</span>
            <div>
              <div className="message-title">Error</div>
              <div className="message-text">{error}</div>
            </div>
          </div>
        )}

        {success && (
          <div className="message-container success-message-box">
            <span className="message-icon">✓</span>
            <div>
              <div className="message-title">Success</div>
              <div className="message-text">{success}</div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn-submit"
            disabled={loading || !description.trim()}
          >
            <span className="btn-icon">{loading ? '⏳' : '📬'}</span>
            <span className="btn-text">{loading ? 'Submitting...' : 'Submit Ticket'}</span>
          </button>
        </div>
      </form>
    </section>
  )
}
