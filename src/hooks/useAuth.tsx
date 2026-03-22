'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase'
import type { User } from '@/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  refreshUser: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  async function fetchUser() {
    try {
      const stored = localStorage.getItem('capideia_user')
      if (stored) {
        setUser(JSON.parse(stored))
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  async function logout() {
    localStorage.removeItem('capideia_user')
    setUser(null)
  }

  async function refreshUser() {
    const stored = localStorage.getItem('capideia_user')
    if (!stored) return
    const u = JSON.parse(stored)
    const { data } = await supabase.from('users').select('*').eq('id', u.id).single()
    if (data) {
      localStorage.setItem('capideia_user', JSON.stringify(data))
      setUser(data)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
