import { useState } from 'react'
import { createItem, type ItemType } from '../api/items'
import './ListView.css'
import './CreateItemModal.css'

type ListFormType = ItemType | 'list'

interface ListFormState {
  type: ListFormType
  name: string
  description: string
  scheduledDate: string
}

function localToday(): string {
  const now = new Date()
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')
}

export function ListView() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<ListFormState>({
    type: 'task',
    name: '',
    description: '',
    scheduledDate: localToday(),
  })

  function openCreateForm() {
    setError(null)
    setForm({
      type: 'task',
      name: '',
      description: '',
      scheduledDate: localToday(),
    })
    setShowCreateForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.name.trim()) {
      setError('Name is required')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await createItem({
        // Backend does not have a dedicated LIST enum yet, so map list to task for now.
        type: form.type === 'list' ? 'task' : form.type,
        name: form.name.trim(),
        description: form.description.trim() || null,
        scheduledDate: form.scheduledDate,
        isRolling: form.type !== 'note',
      })
      setShowCreateForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="list-view" data-testid="lists-view">
      <div className="view-header">
        <div>
          <h1 className="header-title">My Lists</h1>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-icon btn-icon-primary"
            title="Create new list item"
            aria-label="Create new list item"
            onClick={openCreateForm}
            data-testid="add-list-item-button"
          >
            +
          </button>
        </div>
      </div>

      <div className="lists-container">
        <div className="empty-state">No lists created yet. Create your first list to organize your tasks!</div>
      </div>

      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} data-testid="create-list-item-modal">
            <h2 className="modal-header">Create List Item</h2>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="create-form">
              <div className="form-group">
                <label className="form-label">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((current) => ({ ...current, type: e.target.value as ListFormType }))}
                  className="form-select"
                  data-testid="list-item-type-select"
                >
                  <option value="task">Task</option>
                  <option value="note">Note</option>
                  <option value="list">List</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                  placeholder="Enter name"
                  className="form-input"
                  required
                  data-testid="list-item-name-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                  className="form-textarea"
                  rows={3}
                  data-testid="list-item-description-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Scheduled Date</label>
                <input
                  type="date"
                  value={form.scheduledDate}
                  onChange={(e) => setForm((current) => ({ ...current, scheduledDate: e.target.value }))}
                  className="form-input"
                  required
                  data-testid="list-item-date-input"
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateForm(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
