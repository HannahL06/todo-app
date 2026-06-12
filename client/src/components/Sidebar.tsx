import React from 'react'
import './Sidebar.css'

export type ViewType = 'daily' | 'calendar' | 'lists' | 'search' | 'records'

interface SidebarProps {
  activeView: ViewType
  onViewChange: (view: ViewType) => void
}

const views: Array<{ id: ViewType; icon: string; label: string }> = [
  { id: 'daily', icon: '📋', label: 'Daily List' },
  { id: 'calendar', icon: '📅', label: 'Calendar' },
  { id: 'lists', icon: '📝', label: 'Lists' },
  { id: 'search', icon: '🔍', label: 'Search' },
  { id: 'records', icon: '📦', label: 'Records' },
]

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <aside className="sidebar">
      {views.map((view) => (
        <button
          key={view.id}
          className={`nav-icon ${activeView === view.id ? 'active' : ''}`}
          onClick={() => onViewChange(view.id)}
          title={view.label}
          aria-label={view.label}
        >
          {view.icon}
        </button>
      ))}
    </aside>
  )
}
