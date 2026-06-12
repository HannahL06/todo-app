import React from 'react'
import './CalendarView.css'

export function CalendarView() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()

  const monthName = new Date(year, month).toLocaleString('en-US', { month: 'long' })
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const previousDays = Array.from({ length: firstDayOfMonth }, (_, i) => null)
  const allDays = [...previousDays, ...days]

  return (
    <div className="calendar-view">
      <div className="view-header">
        <div>
          <h1 className="header-title">
            {monthName} {year}
          </h1>
        </div>
        <div className="header-actions">
          <button className="btn btn-icon btn-icon-primary" title="Create new item" aria-label="Create new item">
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
            <div key={`${index}`} className={`calendar-cell ${!day ? 'empty' : 'active'}`}>
              {day && <div className="day-number">{day}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
