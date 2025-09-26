
"use client"

import { createContext, useContext, useState, useEffect } from "react"
import type { ReactNode } from "react"

interface AuthContextType {
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  login: async () => {},
  logout: () => {}
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken")
      setIsAuthenticated(!!token)
    }
  }, [])

  const login = async (email: string, password: string) => {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    localStorage.setItem("authToken", "mock-token")
    setIsAuthenticated(true)
  }

  const logout = () => {
    localStorage.removeItem("authToken")
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
