import { Fragment, useEffect, useMemo, useState } from 'react'
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

interface Filters {
  from: string
  to: string
  status: string
  type: string
  sortBy: string
  sortOrder: string
}

const EMPTY_FILTERS: Filters = { from: '', to: '', status: '', type: '', sortBy: 'date', sortOrder: 'desc' }

function localToday(): string {
  const now = new Date()
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-')
}

function formatDateLabel(value: string): string {
  const date = new Date(`${value}T00:00:00`)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function SearchView() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<Filters>(EMPTY_FILTERS)

  useEffect(() => {
    const q = searchQuery.trim()
    const hasFilters = Object.values(appliedFilters).some((v, i) => v !== Object.values(EMPTY_FILTERS)[i])
    if (q.length < 2 && !hasFilters) {
      setResults([])
      setErrorMessage(null)
      setIsLoading(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      setErrorMessage(null)
      try {
        const params = new URLSearchParams()
        if (q.length >= 2) params.set('q', q)
        if (appliedFilters.from) params.set('from', appliedFilters.from)
        if (appliedFilters.to) params.set('to', appliedFilters.to)
        if (appliedFilters.status) params.set('status', appliedFilters.status)
        if (appliedFilters.type) params.set('type', appliedFilters.type)
        if (appliedFilters.sortBy) params.set('sortBy', appliedFilters.sortBy)
        if (appliedFilters.sortOrder) params.set('sortOrder', appliedFilters.sortOrder)

        const token = localStorage.getItem('auth_token')
        const response = await fetch(`${API_BASE_URL}/items/search?${params.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!response.ok) throw new Error('Search failed')
        const data = await response.json()
        setResults((data.items ?? []) as SearchResultItem[])
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Search failed')
      } finally {
        setIsLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [searchQuery, appliedFilters])

  function applyFilters() {
    setAppliedFilters({ ...filters })
    setShowFilters(false)
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS)
    setAppliedFilters(EMPTY_FILTERS)
  }

  const hasActiveFilters = Object.values(appliedFilters).some((v, i) => v !== Object.values(EMPTY_FILTERS)[i])
  const groupedResults = useMemo(() => {
    const groups = new Map<string, { itemId: string; name: string; description: string | null; type: SearchResultItem['type']; instances: SearchResultItem[] }>()

    for (const item of results) {
      const current = groups.get(item.itemId)
      if (current) {
        current.instances.push(item)
      } else {
        groups.set(item.itemId, {
          itemId: item.itemId,
          name: item.name,
          description: item.description,
          type: item.type,
          instances: [item],
        })
      }
    }

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        instances: [...group.instances].sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)),
      }))
      .sort((a, b) => b.instances[b.instances.length - 1].scheduledDate.localeCompare(a.instances[a.instances.length - 1].scheduledDate))
  }, [results])

  return (
    <div className="search-view" data-testid="search-view">
      <div className="view-header">
        <div className="search-bar-wrapper">
          <input
            type="text"
            placeholder="Search items by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            data-testid="search-input"
          />
          <button
            className={`filter-button${hasActiveFilters ? ' filter-active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            title="Open filters"
            aria-label="Open filters"
          >
            Filters{hasActiveFilters ? ' \u2022' : ''}
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
          <div className="filter-row">
            <div className="filter-group">
              <label className="filter-label">From</label>
              <input type="date" className="form-input" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
            </div>
            <div className="filter-group">
              <label className="filter-label">To</label>
              <input type="date" className="form-input" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <label className="filter-label">Status</label>
              <select className="form-select" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
                <option value="">Any</option>
                <option value="untouched">Untouched</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Type</label>
              <select className="form-select" value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}>
                <option value="">Any</option>
                <option value="task">Task</option>
                <option value="appointment">Appointment</option>
                <option value="note">Note</option>
              </select>
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <label className="filter-label">Sort by</label>
              <select className="form-select" value={filters.sortBy} onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value }))}>
                <option value="date">Date</option>
                <option value="status">Status</option>
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Order</label>
              <select className="form-select" value={filters.sortOrder} onChange={(e) => setFilters((f) => ({ ...f, sortOrder: e.target.value }))}>
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
            </div>
          </div>

          <div className="filter-actions">
            <button className="btn btn-secondary" onClick={clearFilters}>Clear</button>
            <button className="btn btn-primary" onClick={applyFilters}>Apply</button>
          </div>
        </div>
      )}

      <div className="search-results-container">
        {searchQuery.trim().length < 2 && !hasActiveFilters && (
          <div className="empty-state">Type at least 2 characters to search, or use filters.</div>
        )}
        {isLoading && <div className="loading">Searching...</div>}
        {errorMessage && <div className="error-message">{errorMessage}</div>}

        {!isLoading && !errorMessage && (searchQuery.trim().length >= 2 || hasActiveFilters) && results.length === 0 && (
          <div className="empty-state">No matching items found.</div>
        )}

        {!isLoading && groupedResults.length > 0 && (
          <div className="search-timeline-groups" data-testid="search-results-list">
            {groupedResults.map((group) => (
              <section className="search-result-group" key={group.itemId} data-testid="search-result-item">
                <div className="search-result-group-header">
                  <div>
                    <div className="search-result-title">{group.name}</div>
                    {group.description && <div className="search-result-description">{group.description}</div>}
                  </div>
                  <span className="search-result-type">{group.type}</span>
                </div>

                <div className="search-timeline-scroll" role="list" aria-label={`${group.name} timeline`}>
                  {group.instances.map((instance, index) => (
                    <Fragment key={instance.dailyItemId}>
                      <article className="timeline-card" role="listitem">
                        <div className="timeline-date">{formatDateLabel(instance.scheduledDate)}</div>
                        <div className={`timeline-status status-${instance.status}`}>{instance.status}</div>
                      </article>
                      {index < group.instances.length - 1 && <span className="timeline-arrow" aria-hidden="true">→</span>}
                    </Fragment>
                  ))}
                </div>
              </section>
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
