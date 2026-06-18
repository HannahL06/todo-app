import './Sidebar.css'

export type ViewType = 'daily' | 'calendar' | 'lists' | 'search' | 'records'

interface SidebarProps {
  activeView: ViewType
  onViewChange: (view: ViewType) => void
  user: { name: string; email: string }
  onLogout: () => void
}

const views: Array<{ id: ViewType; icon: string; label: string }> = [
  { id: 'daily', icon: '📋', label: 'Daily List' },
  { id: 'calendar', icon: '📅', label: 'Calendar' },
  { id: 'lists', icon: '📝', label: 'Lists' },
  { id: 'search', icon: '🔍', label: 'Search' },
  { id: 'records', icon: '📦', label: 'Records' },
]

export function Sidebar({ activeView, onViewChange, user, onLogout }: SidebarProps) {
  return (
    <aside className="sidebar" data-testid="sidebar">
      {views.map((view) => (
        <button
          key={view.id}
          className={`nav-icon ${activeView === view.id ? 'active' : ''}`}
          onClick={() => onViewChange(view.id)}
          title={view.label}
          aria-label={view.label}
          data-testid={`nav-${view.id}`}
        >
          {view.icon}
        </button>
      ))}

      <div className="sidebar-spacer" />

      <div className="sidebar-user" title={user.email}>
        <div className="sidebar-avatar">{user.name.charAt(0).toUpperCase()}</div>
      </div>
      <button className="nav-icon sidebar-logout" onClick={onLogout} title="Sign out" aria-label="Sign out">
        ⏻
      </button>
    </aside>
  )
}
