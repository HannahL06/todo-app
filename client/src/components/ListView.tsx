import React from 'react'
import './ListView.css'

export function ListView() {
  return (
    <div className="list-view">
      <div className="view-header">
        <div>
          <h1 className="header-title">My Lists</h1>
        </div>
        <div className="header-actions">
          <button className="btn btn-icon btn-icon-primary" title="Create new list" aria-label="Create new list">
            +
          </button>
        </div>
      </div>

      <div className="lists-container">
        <div className="empty-state">No lists created yet. Create your first list to organize your tasks!</div>
      </div>
    </div>
  )
}
