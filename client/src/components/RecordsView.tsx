import { useEffect, useState } from 'react'
import { CreateItemModal } from './CreateItemModal'
import { createItem } from '../api/items'
import './RecordsView.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1'

type ItemType = 'task' | 'note' | 'appointment'
type DailyStatus = 'untouched' | 'in-progress' | 'completed'

interface PastDate { date: string; weekday: string }
interface RecordItem {
  dailyItemId: string
  name: string
  type: ItemType
  status: DailyStatus
  description: string | null
}

function localToday(): string {
  const now = new Date()
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-')
}

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

function statusClass(status: DailyStatus) {
  if (status === 'completed') return 'status-completed'
  if (status === 'in-progress') return 'status-in-progress'
  return 'status-incomplete'
}

export function RecordsView() {
  const [showModal, setShowModal] = useState(false)
  const [pastDates, setPastDates] = useState<PastDate[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [recordItems, setRecordItems] = useState<RecordItem[]>([])
  const [isLoadingDates, setIsLoadingDates] = useState(true)
  const [isLoadingItems, setIsLoadingItems] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    fetch(`${API_BASE_URL}/records/dates`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.json())
      .then((d) => setPastDates(d.dates ?? []))
      .catch(() => {})
      .finally(() => setIsLoadingDates(false))
  }, [])

  async function loadRecord(date: string) {
    setSelectedDate(date)
    setIsLoadingItems(true)
    try {
      const token = localStorage.getItem('auth_token')
      const r = await fetch(`${API_BASE_URL}/daily-items?date=${date}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const d = await r.json()
      setRecordItems(d.items ?? [])
    } catch {
      setRecordItems([])
    } finally {
      setIsLoadingItems(false)
    }
  }

  return (
    <div className="records-view" data-testid="records-view">
      <div className="view-header">
        <div>
          <h1 className="header-title">Records</h1>
          <p className="header-subtitle">View past daily lists</p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-icon btn-icon-primary"
            onClick={() => setShowModal(true)}
            title="Create new item"
            aria-label="Create new item"
          >
            +
          </button>
        </div>
      </div>

      <div className="records-body">
        <div className="records-sidebar">
          {isLoadingDates && <div className="loading">Loading…</div>}
          {!isLoadingDates && pastDates.length === 0 && (
            <div className="empty-state" style={{ padding: '16px', fontSize: '13px' }}>No past records yet.</div>
          )}
          {pastDates.map((pd) => (
            <button
              key={pd.date}
              className={`record-date-btn${selectedDate === pd.date ? ' active' : ''}`}
              onClick={() => loadRecord(pd.date)}
            >
              <span className="record-date-day">{pd.weekday}</span>
              <span className="record-date-val">{pd.date}</span>
            </button>
          ))}
        </div>

        <div className="records-detail">
          {!selectedDate && (
            <div className="empty-state">Select a date on the left to view that day's list.</div>
          )}
          {selectedDate && isLoadingItems && <div className="loading">Loading…</div>}
          {selectedDate && !isLoadingItems && (
            <>
              <h2 className="record-detail-heading">{formatFullDate(selectedDate)}</h2>
              {recordItems.length === 0 && <div className="empty-state">Nothing recorded for this day.</div>}
              <div className="record-item-list">
                {recordItems.map((item) => (
                  <div key={item.dailyItemId} className="record-item-row">
                    <div className="record-item-name">{item.name}</div>
                    {item.description && <div className="record-item-desc">{item.description}</div>}
                    <span className={`status-badge ${statusClass(item.status)}`}>{item.status}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {showModal && (
        <CreateItemModal
          onClose={() => setShowModal(false)}
          onSubmit={async (data) => {
            await createItem({
              type: data.type,
              name: data.name,
              description: data.description,
              scheduledDate: data.scheduledDate,
              isRolling: data.isRolling,
            })
            setShowModal(false)
          }}
          initialDate={localToday()}
        />
      )}
    </div>
  )
}
