import { useEffect, useState } from 'react'
import { CreateItemModal } from './CreateItemModal'
import { createItem } from '../api/items'
import './SearchView.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1'

interface SearchResultItem {
  dailyItemId: string
  itemId: string
  name: string
  description: string | null
  type: 'task' | 'note' | 'appointment'
  status: 'untouched' | 'in-progress' | 'completed'
  scheduledDate: string
}

function localToday(): string {
  const now = new Date()
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-')
}

export function SearchView() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const q = searchQuery.trim()
    if (q.length < 2) {
      setResults([])
      setErrorMessage(null)
      setIsLoading(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      setErrorMessage(null)
      try {
        const response = await fetch(`${API_BASE_URL}/items/search?q=${encodeURIComponent(q)}`)
        if (!response.ok) {
          throw new Error('Search failed')
        }

        const data = await response.json()
        setResults((data.items ?? []) as SearchResultItem[])
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Search failed')
      } finally {
        setIsLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [searchQuery])

  return (
    <div className="search-view" data-testid="search-view">
      <div className="view-header">
        <div className="search-bar-wrapper">
          <input
            type="text"
            placeholder="Search items by name or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            data-testid="search-input"
          />
          <button
            className="filter-button"
            onClick={() => setShowFilters(!showFilters)}
            title="Open filters"
            aria-label="Open filters"
          >
            ⚙️
          </button>
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
        {searchQuery.trim().length < 2 && <div className="empty-state">Type at least 2 characters to search.</div>}
        {isLoading && <div className="loading">Searching...</div>}
        {errorMessage && <div className="error-message">{errorMessage}</div>}

        {!isLoading && !errorMessage && searchQuery.trim().length >= 2 && results.length === 0 && (
          <div className="empty-state">No matching items found.</div>
        )}

        {!isLoading && results.length > 0 && (
          <div className="search-result-list" data-testid="search-results-list">
            {results.map((item) => (
              <div className="search-result-item" key={item.dailyItemId} data-testid="search-result-item">
                <div className="search-result-title">{item.name}</div>
                <div className="search-result-meta">
                  <span>{item.scheduledDate}</span>
                  <span>•</span>
                  <span>{item.type}</span>
                  <span>•</span>
                  <span>{item.status}</span>
                </div>
                {item.description && <div className="search-result-description">{item.description}</div>}
              </div>
            ))}
          </div>
        )}
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
