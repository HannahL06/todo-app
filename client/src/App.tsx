import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type ItemType = 'task' | 'note' | 'appointment'
type DailyStatus = 'untouched' | 'in-progress' | 'completed'

type DailyItem = {
  dailyItemId: string
  itemId: string
  type: ItemType
  name: string
  description: string | null
  status: DailyStatus
  sortOrder: number | null
  isRolling: boolean
}

type DailyItemsResponse = {
  date: string
  items: DailyItem[]
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1'

const statusLabels: Record<DailyStatus, string> = {
  untouched: 'Not worked on',
  'in-progress': 'In progress',
  completed: 'Completed',
}

const statusToneClass: Record<DailyStatus, string> = {
  untouched: 'status-untouched',
  'in-progress': 'status-in-progress',
  completed: 'status-completed',
}

function todayDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function App() {
  const [selectedDate, setSelectedDate] = useState(todayDate)
  const [items, setItems] = useState<DailyItem[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<ItemType>('task')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const completedCount = useMemo(
    () => items.filter((item) => item.status === 'completed').length,
    [items],
  )

  useEffect(() => {
    void loadDailyItems(selectedDate)
  }, [selectedDate])

  async function loadDailyItems(date: string) {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const response = await fetch(`${API_BASE_URL}/daily-items?date=${date}`)

      if (!response.ok) {
        throw new Error('Could not load the daily list.')
      }

      const data: DailyItemsResponse = await response.json()
      setItems(data.items)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not load the daily list.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCreateItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!name.trim()) {
      setErrorMessage('Give the item a name before saving it.')
      return
    }

    setIsSaving(true)
    setErrorMessage(null)

    try {
      const response = await fetch(`${API_BASE_URL}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

  async function handleCycleStatus(dailyItemId: string) {
    const currentItem = items.find((item) => item.dailyItemId === dailyItemId)

    if (!currentItem) {
      return
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.dailyItemId === dailyItemId ? { ...item, status: nextStatus(item.status) } : item,
      ),
    )

    try {
      const response = await fetch(`${API_BASE_URL}/daily-items/${dailyItemId}/cycle-status`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Could not update that status.')
      }

      const updatedItem: DailyItem = await response.json()
      setItems((currentItems) =>
        currentItems.map((item) => (item.dailyItemId === dailyItemId ? updatedItem : item)),
      )
    } catch (error) {
      setItems((currentItems) =>
        currentItems.map((item) => (item.dailyItemId === dailyItemId ? currentItem : item)),
      )
      setErrorMessage(error instanceof Error ? error.message : 'Could not update that status.')
    }
  }

  return (
    <main className="shell">
      <section className="hero-panel">
        <p className="eyebrow">Today-first planning</p>
        <div className="hero-heading">
          <div>
            <h1>Daily focus board</h1>
            <p>
              Capture a task, note, or appointment for the day, then move it from untouched to in progress to completed.
            </p>
          </div>
          <label className="date-picker">
            <span>Working date</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </label>
        </div>

        <div className="hero-stats">
          <article>
            <span>Total items</span>
            <strong>{items.length}</strong>
          </article>
          <article>
            <span>Completed</span>
            <strong>{completedCount}</strong>
          </article>
          <article>
            <span>Still active</span>
            <strong>{items.length - completedCount}</strong>
          </article>
        </div>
      </section>

      <section className="workspace-grid">
        <section className="composer-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Quick add</p>
              <h2>Add something to this day</h2>
            </div>
          </div>

          <form className="composer-form" onSubmit={handleCreateItem}>
            <label>
              <span>Name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Finish landlord email" />
            </label>

            <label>
              <span>Type</span>
              <select value={type} onChange={(event) => setType(event.target.value as ItemType)}>
                <option value="task">Task</option>
                <option value="note">Note</option>
                <option value="appointment">Appointment</option>
              </select>
            </label>

            <label>
              <span>Description</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                placeholder="Optional detail for the day"
              />
            </label>

            <button type="submit" className="primary-button" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Add to daily list'}
            </button>
          </form>
        </section>

        <section className="board-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Daily list</p>
              <h2>{selectedDate}</h2>
            </div>
            <button type="button" className="ghost-button" onClick={() => void loadDailyItems(selectedDate)}>
              Refresh
            </button>
          </div>

          {errorMessage ? <p className="error-banner">{errorMessage}</p> : null}

          {isLoading ? <p className="empty-state">Loading the day...</p> : null}

          {!isLoading && items.length === 0 ? (
            <p className="empty-state">Nothing is scheduled yet. Start with a task or note for this day.</p>
          ) : null}

          <div className="daily-list">
            {items.map((item) => (
              <article key={item.dailyItemId} className="daily-card">
                <div className="daily-card-main">
                  <button
                    type="button"
                    className={`status-button ${statusToneClass[item.status]}`}
                    onClick={() => void handleCycleStatus(item.dailyItemId)}
                  >
                    {statusLabels[item.status]}
                  </button>

                  <div>
                    <div className="title-row">
                      <h3>{item.name}</h3>
                      <span className="type-pill">{item.type}</span>
                    </div>
                    {item.description ? <p>{item.description}</p> : null}
                  </div>
                </div>

                <p className="meta-row">
                  {item.isRolling ? 'Rolling forward when unfinished' : 'Stays only on this day'}
                </p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}

function nextStatus(status: DailyStatus): DailyStatus {
  if (status === 'untouched') {
    return 'in-progress'
  }

  if (status === 'in-progress') {
    return 'completed'
  }

  return 'untouched'
}

export default App
