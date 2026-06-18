import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Sidebar, type ViewType } from './components/Sidebar'
import { DailyListView } from './components/DailyListView'
import { CalendarView } from './components/CalendarView'
import { ListView } from './components/ListView'
import { SearchView } from './components/SearchView'
import { RecordsView } from './components/RecordsView'
import { AuthPage } from './components/AuthPage'
import './styles/global.css'
import './App.css'

function AppShell() {
  const { user, isLoading, logout } = useAuth()
  const [activeView, setActiveView] = useState<ViewType>('daily')

  if (isLoading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-secondary)' }}>Loading…</div>
  if (!user) return <AuthPage />

  return (
    <div className="app-container">
      <Sidebar activeView={activeView} onViewChange={setActiveView} user={user} onLogout={logout} />

      <main className="main-content">
        <div className="view-container">
          {activeView === 'daily' && <DailyListView />}
          {activeView === 'calendar' && <CalendarView />}
          {activeView === 'lists' && <ListView />}
          {activeView === 'search' && <SearchView />}
          {activeView === 'records' && <RecordsView />}
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}

export default App
