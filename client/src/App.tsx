import { useState } from 'react'
import { Sidebar, type ViewType } from './components/Sidebar'
import { DailyListView } from './components/DailyListView'
import { CalendarView } from './components/CalendarView'
import { ListView } from './components/ListView'
import { SearchView } from './components/SearchView'
import { RecordsView } from './components/RecordsView'
import './styles/global.css'
import './App.css'

function App() {
  const [activeView, setActiveView] = useState<ViewType>('daily')

  return (
    <div className="app-container">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

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

export default App
