export type ItemType = 'task' | 'note' | 'appointment'

export interface CreateItemPayload {
  type: ItemType
  name: string
  description: string | null
  scheduledDate: string
  isRolling?: boolean
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1'

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function createItem(payload: CreateItemPayload) {
  const response = await fetch(`${API_BASE_URL}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error('Could not create that item.')
  return response.json()
}

export async function removeItemForToday(dailyItemId: string) {
  const response = await fetch(`${API_BASE_URL}/daily-items/${dailyItemId}/remove-today`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  if (!response.ok) throw new Error('Could not remove that item for today.')
}

export async function stopItemRolling(dailyItemId: string) {
  const response = await fetch(`${API_BASE_URL}/daily-items/${dailyItemId}/stop-rolling`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  if (!response.ok) throw new Error('Could not stop that item from rolling.')
}

export async function updateItem(itemId: string, payload: { name?: string; description?: string | null; isRolling?: boolean }) {
  const response = await fetch(`${API_BASE_URL}/items/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error('Could not update that item.')
  return response.json() as Promise<{ itemId: string; name: string; description: string | null; isRolling: boolean }>
}
