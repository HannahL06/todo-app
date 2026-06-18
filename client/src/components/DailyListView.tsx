import { useEffect, useState, type DragEvent } from 'react'
import { CreateItemModal } from './CreateItemModal'
import { createItem, removeItemForToday, stopItemRolling, updateItem } from '../api/items'
import './DailyListView.css'

type ItemType = 'task' | 'note' | 'appointment'
type DailyStatus = 'untouched' | 'in-progress' | 'completed'

interface DailyItem {
  dailyItemId: string
  itemId: string
  type: ItemType
  name: string
  description: string | null
  notes: string | null
  status: DailyStatus
  sortOrder: number | null
  isRolling: boolean
  scheduledDate: string
  time?: string // For appointments
}

interface CreateItemInput {
  type: ItemType
  name: string
  description: string | null
  notes: string | null
  time: string | null
  status: DailyStatus
  sortOrder: number | null
  isRolling: boolean
  scheduledDate: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1'

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
  return date.toLocaleDateString('en-US', options)
}

function getStatusColor(status: DailyStatus): string {
  switch (status) {
    case 'in-progress':
      return 'status-in-progress'
    case 'completed':
      return 'status-completed'
    case 'untouched':
    default:
      return 'status-incomplete'
  }
}

function localToday(): string {
  const now = new Date()
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')
}

function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

export function DailyListView() {
  const [selectedDate, setSelectedDate] = useState(localToday)

  const [items, setItems] = useState<DailyItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingItem, setEditingItem] = useState<DailyItem | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null)

  useEffect(() => {
    loadDailyItems(selectedDate)
  }, [selectedDate])

  async function loadDailyItems(date: string) {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_BASE_URL}/daily-items?date=${date}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (!response.ok) {
        throw new Error('Could not load the daily list.')
      }

      const data = await response.json()
      setItems(data.items || [])
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not load the daily list.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCycleStatus(dailyItemId: string) {
    const currentItem = items.find((item) => item.dailyItemId === dailyItemId)

    if (!currentItem) {
      return
    }

    const nextStatus: Record<DailyStatus, DailyStatus> = {
      untouched: 'in-progress',
      'in-progress': 'completed',
      completed: 'untouched',
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.dailyItemId === dailyItemId ? { ...item, status: nextStatus[item.status] } : item,
      ),
    )

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_BASE_URL}/daily-items/${dailyItemId}/cycle-status`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (!response.ok) {
        throw new Error('Could not update that status.')
      }

      const updatedItem: DailyItem = await response.json()
      setItems((currentItems) =>
        currentItems.map((item) => (item.dailyItemId === dailyItemId ? updatedItem : item)),
      )
    } catch (error) {
      setItems((currentItems) =>
        currentItems.map((item) => (item.dailyItemId === dailyItemId ? currentItem : item)),
      )
      setErrorMessage(error instanceof Error ? error.message : 'Could not update that status.')
    }
  }

  async function handleItemCreated(data: CreateItemInput) {
    try {
      const createdItem: DailyItem = await createItem({
        name: data.name,
        description: data.description || null,
        type: data.type,
        scheduledDate: data.scheduledDate,
        isRolling: data.isRolling,
      })
      if (data.scheduledDate === selectedDate) {
        setItems((currentItems) => [...currentItems, createdItem])
      }
      setShowCreateModal(false)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not create that item.')
    }
  }

  async function handleRemoveForToday(dailyItemId: string) {
    const previousItems = items
    setItems((current) => current.filter((item) => item.dailyItemId !== dailyItemId))
    try {
      await removeItemForToday(dailyItemId)
    } catch (error) {
      setItems(previousItems)
      setErrorMessage(error instanceof Error ? error.message : 'Could not remove that item.')
    }
  }

  async function handleStopRolling(dailyItemId: string) {
    const previousItems = items
    setItems((current) => current.filter((item) => item.dailyItemId !== dailyItemId))
    try {
      await stopItemRolling(dailyItemId)
    } catch (error) {
      setItems(previousItems)
      setErrorMessage(error instanceof Error ? error.message : 'Could not stop that item from rolling.')
    }
  }

  function openEditModal(item: DailyItem) {
    setEditingItem(item)
    setEditName(item.name)
    setEditDescription(item.description ?? '')
  }

  async function handleSaveEdit() {
    if (!editingItem) return
    setEditSaving(true)
    try {
      const updated = await updateItem(editingItem.itemId, {
        name: editName.trim() || editingItem.name,
        description: editDescription.trim() || null,
      })
      setItems((current) =>
        current.map((i) =>
          i.itemId === editingItem.itemId
            ? { ...i, name: updated.name, description: updated.description }
            : i,
        ),
      )
      setEditingItem(null)
    } catch {
      setErrorMessage('Could not save changes.')
    } finally {
      setEditSaving(false)
    }
  }

  function reorderItems(currentItems: DailyItem[], sourceId: string, targetId: string): DailyItem[] {
    const sourceIndex = currentItems.findIndex((item) => item.dailyItemId === sourceId)
    const targetIndex = currentItems.findIndex((item) => item.dailyItemId === targetId)

    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
      return currentItems
    }

    const nextItems = [...currentItems]
    const [movedItem] = nextItems.splice(sourceIndex, 1)
    nextItems.splice(targetIndex, 0, movedItem)
    return nextItems
  }

  async function persistReorder(reorderedItems: DailyItem[]) {
    const token = localStorage.getItem('auth_token')
    const response = await fetch(`${API_BASE_URL}/daily-items/reorder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        date: selectedDate,
        orderedDailyItemIds: reorderedItems.map((item) => item.dailyItemId),
      }),
    })

    if (!response.ok) {
      throw new Error('Could not save the new order.')
    }
  }

  function handleDragStart(dailyItemId: string, event: DragEvent<HTMLDivElement>) {
    setDraggedItemId(dailyItemId)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', dailyItemId)
  }

  function handleDragOver(dailyItemId: string, event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    if (dailyItemId !== draggedItemId) {
      setDragOverItemId(dailyItemId)
    }
  }

  function handleDragLeave(dailyItemId: string) {
    if (dragOverItemId === dailyItemId) {
      setDragOverItemId(null)
    }
  }

  async function handleDrop(targetItemId: string) {
    if (!draggedItemId || draggedItemId === targetItemId) {
      setDraggedItemId(null)
      setDragOverItemId(null)
      return
    }

    const previousItems = items
    const reorderedItems = reorderItems(previousItems, draggedItemId, targetItemId)
    setItems(reorderedItems)
    setDraggedItemId(null)
    setDragOverItemId(null)

    try {
      await persistReorder(reorderedItems)
    } catch (error) {
      setItems(previousItems)
      setErrorMessage(error instanceof Error ? error.message : 'Could not save the new order.')
    }
  }

  function handleDragEnd() {
    setDraggedItemId(null)
    setDragOverItemId(null)
  }

  const isToday = selectedDate === localToday()

  return (
    <div className="daily-list-view" data-testid="daily-list-view">
      <div className="view-header">
        <div className="date-nav">
          <button
            className="btn btn-icon date-nav-arrow"
            onClick={() => setSelectedDate((d) => offsetDate(d, -1))}
            title="Previous day"
            aria-label="Previous day"
            data-testid="prev-day-button"
          >
            ‹
          </button>

          <div className="date-nav-center">
            <h1 className="header-title" data-testid="date-display">{formatDateHeader(selectedDate)}</h1>
            <div data-testid="date-header" hidden>{selectedDate}</div>
            {!isToday && (
              <button
                className="btn btn-today"
                onClick={() => setSelectedDate(localToday())}
                data-testid="today-button"
              >
                Back to Today
              </button>
            )}
          </div>

          <button
            className="btn btn-icon date-nav-arrow"
            onClick={() => setSelectedDate((d) => offsetDate(d, 1))}
            title="Next day"
            aria-label="Next day"
            data-testid="next-day-button"
          >
            ›
          </button>
        </div>

        <div className="header-actions">
          <button
            className="btn btn-icon btn-icon-primary"
            onClick={() => setShowCreateModal(true)}
            title="Create new item"
            aria-label="Create new item"
            data-testid="add-item-button"
          >
            +
          </button>
        </div>
      </div>

      {errorMessage && <div className="error-message" data-testid="error-message">{errorMessage}</div>}

      <div className="daily-items-container">
        {isLoading && <div className="loading" data-testid="loading-state">Loading items...</div>}

        {!isLoading && items.length === 0 && (
          <div className="empty-state" data-testid="empty-state">
            {isToday
              ? 'Start by creating a task, note, or appointment for today.'
              : 'Nothing scheduled for this day.'}
          </div>
        )}

        {!isLoading && items.length > 0 && (
          <div className="daily-items-list">
            {items.map((item) => (
              <div
                key={item.dailyItemId}
                className={`item-row ${draggedItemId === item.dailyItemId ? 'is-dragging' : ''} ${dragOverItemId === item.dailyItemId ? 'is-drop-target' : ''}`}
                data-testid="daily-item"
                data-status={item.status}
                data-type={item.type}
                onDragOver={(event) => handleDragOver(item.dailyItemId, event)}
                onDragLeave={() => handleDragLeave(item.dailyItemId)}
                onDrop={() => handleDrop(item.dailyItemId)}
              >
                <div className="item-content">
                  <div
                    className="item-name drag-handle"
                    draggable
                    onDragStart={(event) => handleDragStart(item.dailyItemId, event)}
                    onDragEnd={handleDragEnd}
                    title="Drag to reorder — click to edit"
                    data-testid="item-drag-handle"
                    onClick={() => openEditModal(item)}
                  >
                    {item.name}
                  </div>
                  {item.description && <div className="item-description">{item.description}</div>}
                  {item.notes && <div className="item-notes">{item.notes}</div>}
                  {item.time && item.type === 'appointment' && <div className="item-time">🕒 {item.time}</div>}
                </div>

                <div className="item-actions">
                  <button
                    type="button"
                    className="item-action-btn"
                    onClick={() => handleRemoveForToday(item.dailyItemId)}
                    title="Hide from today only"
                    data-testid="remove-today-button"
                  >
                    Skip today
                  </button>
                  {item.isRolling && (
                    <button
                      type="button"
                      className="item-action-btn danger"
                      onClick={() => handleStopRolling(item.dailyItemId)}
                      title="Stop this item from rolling forward permanently"
                      data-testid="stop-rolling-button"
                    >
                      Stop rolling
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  className={`status-badge ${getStatusColor(item.status)}`}
                  onClick={() => handleCycleStatus(item.dailyItemId)}
                  title={`Click to cycle status: ${item.status}`}
                  data-testid="status-badge"
                >
                  {item.status}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateItemModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleItemCreated}
          initialDate={selectedDate}
        />
      )}

      {editingItem && (
        <div className="modal-overlay" onClick={() => setEditingItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} data-testid="edit-item-modal">
            <h2 className="modal-header">Edit Item</h2>
            <div className="create-form">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="form-input"
                  autoFocus
                  data-testid="edit-name-input"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit() }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="form-textarea"
                  rows={3}
                  data-testid="edit-description-input"
                />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setEditingItem(null)} disabled={editSaving}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSaveEdit} disabled={editSaving || !editName.trim()}>
                  {editSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
