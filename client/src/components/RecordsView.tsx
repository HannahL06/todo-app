import React from 'react'
import './RecordsView.css'

export function RecordsView() {
  return (
    <div className="records-view">
      <div className="view-header">
        <div>
          <h1 className="header-title">Records</h1>
          <p className="header-subtitle">View past daily lists</p>
        </div>
      </div>

      <div className="records-container">
        <div className="empty-state">No records available yet. Your past daily lists will appear here.</div>
      </div>
    </div>
  )
}
