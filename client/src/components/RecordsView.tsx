import { useState } from 'react'
import { CreateItemModal } from './CreateItemModal'
import { createItem } from '../api/items'
import './RecordsView.css'

function localToday(): string {
  const now = new Date()
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-')
}

export function RecordsView() {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="records-view" data-testid="records-view">
      <div className="view-header">
        <div>
          <h1 className="header-title">Records</h1>
          <p className="header-subtitle">View past daily lists</p>
        </div>
        <div className="header-actions">
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

      <div className="records-container">
        <div className="empty-state">No records available yet. Your past daily lists will appear here.</div>
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
