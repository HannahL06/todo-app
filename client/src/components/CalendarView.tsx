import { useCallback, useEffect, useState } from 'react'
import { CreateItemModal } from './CreateItemModal'
import { createItem } from '../api/items'
import './CalendarView.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1'

interface CalendarItem {
  type: 'task' | 'note' | 'appointment'
  name: string
}

function formatDate(year: number, month: number, day: number): string {
  return [year, String(month + 1).padStart(2, '0'), String(day).padStart(2, '0')].join('-')
}

function localToday(): string {
  const now = new Date()
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-')
}

export function CalendarView() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()

  const monthName = new Date(year, month).toLocaleString('en-US', { month: 'long' })
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const previousDays = Array.from({ length: firstDayOfMonth }, () => null)
  const allDays = [...previousDays, ...days]

  const [showModal, setShowModal] = useState(false)
  const [modalDate, setModalDate] = useState(localToday())
  const [appointmentsByDate, setAppointmentsByDate] = useState<Record<string, string[]>>({})

  function openModal(day?: number) {
    const d = day ? formatDate(year, month, day) : localToday()
    setModalDate(d)
    setShowModal(true)
  }

  const loadMonthAppointments = useCallback(async () => {
    try {
      const entries = await Promise.all(
        days.map(async (day) => {
          const date = formatDate(year, month, day)
          const response = await fetch(`${API_BASE_URL}/daily-items?date=${date}`)
          if (!response.ok) {
            return [date, []] as const
          }

          const data = await response.json()
          const names = ((data.items as CalendarItem[] | undefined) ?? [])
            .filter((item) => item.type === 'appointment')
            .map((item) => item.name)

          return [date, names] as const
        }),
      )

      setAppointmentsByDate(Object.fromEntries(entries))
    } catch {
      setAppointmentsByDate({})
    }
  }, [days, month, year])

  useEffect(() => {
    loadMonthAppointments()
  }, [loadMonthAppointments])

  return (
    <div className="calendar-view" data-testid="calendar-view">
      <div className="view-header">
        <div>
          <h1 className="header-title" data-testid="calendar-month">
            {monthName} {year}
          </h1>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-icon btn-icon-primary"
            onClick={() => openModal()}
            title="Create new item"
            aria-label="Create new item"
          >
            +
          </button>
        </div>
      </div>

      <div className="calendar-container">
        <div className="calendar-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="calendar-day-header">
              {day}
            </div>
          ))}

          {allDays.map((day, index) => (
            <div
              key={`${index}`}
              className={`calendar-cell ${!day ? 'empty' : 'active'}`}
              onClick={() => day && openModal(day)}
              style={day ? { cursor: 'pointer' } : undefined}
            >
              {day && (
                <>
                  <div className="day-number">{day}</div>
                  {(appointmentsByDate[formatDate(year, month, day)] ?? []).slice(0, 2).map((name) => (
                    <div className="appointment-chip" data-testid="calendar-appointment-chip" key={`${day}-${name}`}>
                      {name}
                    </div>
                  ))}
                </>
              )}
            </div>
          ))}
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
            await loadMonthAppointments()
          }}
          initialDate={modalDate}
        />
      )}
    </div>
  )
}
