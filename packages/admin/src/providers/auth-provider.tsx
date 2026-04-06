import { createContext, type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { adminClient } from '@/client'

interface AuthUser {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

const TOKEN_KEY = 'spree_admin_token'
const REFRESH_TOKEN_KEY = 'spree_admin_refresh_token'
const USER_KEY = 'spree_admin_user'

// Refresh 2 minutes before expiry (JWT default is 1 hour)
const REFRESH_INTERVAL_MS = 58 * 60 * 1000

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem(USER_KEY)
    return stored ? JSON.parse(stored) : null
  })
  const [isLoading, setIsLoading] = useState(false)
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isRefreshingRef = useRef(false)

  const clearTokens = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = null
    }
  }, [])

  const storeTokens = useCallback((accessToken: string, refreshToken: string, authUser: AuthUser) => {
    adminClient.setToken(accessToken)
    setToken(accessToken)
    setUser(authUser)
    localStorage.setItem(TOKEN_KEY, accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    localStorage.setItem(USER_KEY, JSON.stringify(authUser))
  }, [])

  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (!refreshToken || isRefreshingRef.current) return false

    isRefreshingRef.current = true
    try {
      const response = await adminClient.auth.refresh({ refresh_token: refreshToken })
      if (response.refresh_token) {
        storeTokens(response.token, response.refresh_token, response.user)
      }
      return true
    } catch {
      clearTokens()
      return false
    } finally {
      isRefreshingRef.current = false
    }
  }, [storeTokens, clearTokens])

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
    }
    refreshTimerRef.current = setTimeout(async () => {
      await refreshAccessToken()
      // Reschedule on success (clearTokens stops the chain on failure)
      if (localStorage.getItem(REFRESH_TOKEN_KEY)) {
        scheduleRefresh()
      }
    }, REFRESH_INTERVAL_MS)
  }, [refreshAccessToken])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await adminClient.auth.login({ email, password })
      storeTokens(response.token, response.refresh_token!, response.user)
      scheduleRefresh()
    } finally {
      setIsLoading(false)
    }
  }, [storeTokens, scheduleRefresh])

  const logout = useCallback(() => {
    clearTokens()
  }, [clearTokens])

  // On mount: refresh the token if we have a refresh token stored
  // biome-ignore lint/correctness/useExhaustiveDependencies: only run on mount
  useEffect(() => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (!refreshToken) {
      // No refresh token — clear stale JWT-only sessions
      if (token) clearTokens()
      return
    }

    // Refresh immediately on mount, then schedule periodic refresh
    refreshAccessToken().then((success) => {
      if (success) scheduleRefresh()
    })

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
