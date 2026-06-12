import React, { useEffect, useState } from 'react'
import { CreateItemModal } from './CreateItemModal'
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

function getItemMarker(type: ItemType): string {
  switch (type) {
    case 'appointment':
      return '–'
    case 'note':
      return '★'
    case 'task':
    default:
      return '•'
  }
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

export function DailyListView() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })

  const [items, setItems] = useState<DailyItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadDailyItems(selectedDate)
  }, [selectedDate])

  async function loadDailyItems(date: string) {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const response = await fetch(`${API_BASE_URL}/daily-items?date=${date}`)

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
      const response = await fetch(`${API_BASE_URL}/daily-items/${dailyItemId}/cycle-status`, {
        method: 'POST',
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

  async function handleItemCreated(data: Omit<DailyItem, 'dailyItemId' | 'itemId'>) {
    try {
      const response = await fetch(`${API_BASE_URL}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description || null,
          notes: data.notes || null,
          type: data.type,
          scheduledDate: selectedDate,
          time: data.time || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Could not create that item.')
      }

      const createdItem: DailyItem = await response.json()
      setItems((currentItems) => [...currentItems, createdItem])
      setShowCreateModal(false)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not create that item.')
    }
  }

  return (
    <div className="daily-list-view">
      <div className="view-header">
        <div>
          <h1 className="header-title">{formatDateHeader(selectedDate)}</h1>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-icon btn-icon-primary"
            onClick={() => setShowCreateModal(true)}
            title="Create new item"
            aria-label="Create new item"
          >
            +
          </button>
        </div>
      </div>

      {errorMessage && <div className="error-message">{errorMessage}</div>}

      <div className="daily-items-container">
        {isLoading && <div className="loading">Loading items...</div>}

        {!isLoading && items.length === 0 && (
          <div className="empty-state">Start by creating a task, note, or appointment for today.</div>
        )}

        {!isLoading && items.length > 0 && (
          <div className="daily-items-list">
            {items.map((item) => (
              <div key={item.dailyItemId} className="item-row">
                <div
                  className="item-marker"
                  onClick={() => handleCycleStatus(item.dailyItemId)}
                  title={`Click to cycle status: ${item.status}`}
                >
                  <span className={`status-dot ${getStatusColor(item.status)}`}>{getItemMarker(item.type)}</span>
                </div>

                <div className="item-content">
                  <div className="item-name">{item.name}</div>
                  {item.description && <div className="item-description">{item.description}</div>}
                  {item.notes && <div className="item-notes">{item.notes}</div>}
                  {item.time && item.type === 'appointment' && <div className="item-time">🕒 {item.time}</div>}
                </div>

                <div className={`status-badge ${getStatusColor(item.status)}`}>{item.status}</div>
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
    </div>
  )
}
