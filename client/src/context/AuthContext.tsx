import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1'

interface AuthUser {
  id: string
  email: string
  name: string
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  authFetch: (url: string, init?: RequestInit) => Promise<Response>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('auth_token')
    if (!stored) { setIsLoading(false); return }

    // Verify token is still valid
    fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${stored}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('invalid')
        return r.json()
      })
      .then((u: AuthUser) => {
        setToken(stored)
        setUser(u)
      })
      .catch(() => localStorage.removeItem('auth_token'))
      .finally(() => setIsLoading(false))
  }, [])

  async function login(email: string, password: string) {
    const r = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!r.ok) {
      const body = await r.json().catch(() => ({}))
      throw new Error(body.message ?? 'Login failed')
    }
    const { accessToken, user: u } = await r.json()
    localStorage.setItem('auth_token', accessToken)
    setToken(accessToken)
    setUser(u)
  }

  async function register(name: string, email: string, password: string) {
    const r = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    if (!r.ok) {
      const body = await r.json().catch(() => ({}))
      throw new Error(body.message ?? 'Registration failed')
    }
    const { accessToken, user: u } = await r.json()
    localStorage.setItem('auth_token', accessToken)
    setToken(accessToken)
    setUser(u)
  }

  function logout() {
    localStorage.removeItem('auth_token')
    setToken(null)
    setUser(null)
  }

  function authFetch(url: string, init: RequestInit = {}) {
    return fetch(url, {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
      },
    })
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
