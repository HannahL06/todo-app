import React, { useState } from 'react'
import './SearchView.css'

export function SearchView() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="search-view">
      <div className="view-header">
        <div className="search-bar-wrapper">
          <input
            type="text"
            placeholder="Search items by name or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button
            className="filter-button"
            onClick={() => setShowFilters(!showFilters)}
            title="Open filters"
            aria-label="Open filters"
          >
            ⚙️
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="filter-panel">
          <div className="filter-group">
            <label className="filter-label">Date Range</label>
            <input type="date" className="form-input" />
            <span className="filter-to">to</span>
            <input type="date" className="form-input" />
          </div>

          <div className="filter-group">
            <label className="filter-label">Status</label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked />
                <span>Not Started</span>
              </label>
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked />
                <span>In Progress</span>
              </label>
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked />
                <span>Completed</span>
              </label>
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Item Type</label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked />
                <span>Task</span>
              </label>
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked />
                <span>Appointment</span>
              </label>
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked />
                <span>Note</span>
              </label>
            </div>
          </div>

          <div className="filter-actions">
            <button className="btn btn-secondary">Clear</button>
            <button className="btn btn-primary">Apply</button>
          </div>
        </div>
      )}

      <div className="search-results-container">
        <div className="empty-state">Enter a search term to find items.</div>
      </div>
    </div>
  )
}
