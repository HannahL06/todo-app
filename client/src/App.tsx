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
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          type,
          scheduledDate: selectedDate,
        }),
      })

      if (!response.ok) {
        throw new Error('Could not create that item.')
      }

      const createdItem: DailyItem = await response.json()
      setItems((currentItems) => [...currentItems, createdItem])
      setName('')
      setDescription('')
      setType('task')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not create that item.')
    } finally {
      setIsSaving(false)
    }
  }

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

export default App
