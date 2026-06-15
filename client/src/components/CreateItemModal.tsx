import React, { useState } from 'react'
import './CreateItemModal.css'

type ItemType = 'task' | 'note' | 'appointment'

interface CreateItemFormData {
  type: ItemType
  name: string
  description: string | null
  notes: string | null
  time: string | null
  status: 'untouched'
  sortOrder: number | null
  isRolling: boolean
  scheduledDate: string
}

interface CreateItemModalProps {
  onClose: () => void
  onSubmit: (data: CreateItemFormData) => Promise<void>
  initialDate: string
}

export function CreateItemModal({ onClose, onSubmit, initialDate }: CreateItemModalProps) {
  const [type, setType] = useState<ItemType>('task')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [time, setTime] = useState('12:00')
  const [scheduledDate, setScheduledDate] = useState(initialDate)
  const [isRolling, setIsRolling] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      setError('Task name is required')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit({
        type,
        name: name.trim(),
        description: description.trim() || null,
        notes: notes.trim() || null,
        time: type === 'appointment' ? time : null,
        status: 'untouched',
        sortOrder: null,
        isRolling,
        scheduledDate,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} data-testid="create-item-modal">
        <h2 className="modal-header">Create New Item</h2>

        {error && <div className="error-message" data-testid="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="create-form">
          <div className="form-group">
            <label className="form-label">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ItemType)}
              className="form-select"
              data-testid="item-type-select"
            >
              <option value="task">Task</option>
              <option value="appointment">Appointment</option>
              <option value="note">Note</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Task Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter task name"
              className="form-input"
              data-testid="item-name-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details (optional)"
              className="form-textarea"
              data-testid="item-description-input"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Scheduled Date</label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="form-input"
              data-testid="item-date-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Personal notes (optional)"
              className="form-textarea"
              rows={2}
            />
          </div>

          {type === 'appointment' && (
            <div className="form-group">
              <label className="form-label">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="form-input"
              />
            </div>
          )}

          {type !== 'note' && (
            <div className="form-group form-group-inline">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={isRolling}
                  onChange={(e) => setIsRolling(e.target.checked)}
                  data-testid="item-rolling-input"
                />
                <span>Roll forward if not completed</span>
              </label>
            </div>
          )}

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
              data-testid="cancel-button"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting} data-testid="create-button">
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
