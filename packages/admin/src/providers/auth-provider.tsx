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
  // Serialize all refresh calls — prevents double-rotation from StrictMode/HMR
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null)

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = null
    }
  }, [])

  const clearTokens = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    clearRefreshTimer()
  }, [clearRefreshTimer])

  const storeTokens = useCallback((accessToken: string, refreshToken: string, authUser: AuthUser) => {
    adminClient.setToken(accessToken)
    setToken(accessToken)
    setUser(authUser)
    localStorage.setItem(TOKEN_KEY, accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    localStorage.setItem(USER_KEY, JSON.stringify(authUser))
  }, [])

  const doRefresh = useCallback(async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (!refreshToken) return false

    try {
      const response = await adminClient.auth.refresh({ refresh_token: refreshToken })
      if (response.refresh_token) {
        storeTokens(response.token, response.refresh_token, response.user)
      }
      return true
    } catch {
      clearTokens()
      return false
    }
  }, [storeTokens, clearTokens])

  // Serialize: if a refresh is already in-flight, return the same promise
  const refreshAccessToken = useCallback((): Promise<boolean> => {
    if (refreshPromiseRef.current) return refreshPromiseRef.current

    const promise = doRefresh().finally(() => {
      refreshPromiseRef.current = null
    })
    refreshPromiseRef.current = promise
    return promise
  }, [doRefresh])

  const scheduleRefresh = useCallback(() => {
    clearRefreshTimer()
    refreshTimerRef.current = setTimeout(async () => {
      const success = await refreshAccessToken()
      if (success) scheduleRefresh()
    }, REFRESH_INTERVAL_MS)
  }, [refreshAccessToken, clearRefreshTimer])

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

  // Register 401 handler: refresh token and retry the failed request
  // biome-ignore lint/correctness/useExhaustiveDependencies: only run on mount
  useEffect(() => {
    adminClient.onUnauthorized(async () => {
      const success = await refreshAccessToken()
      if (success) scheduleRefresh()
      return success
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // On mount: refresh the token if we have a refresh token stored
  // biome-ignore lint/correctness/useExhaustiveDependencies: only run on mount
  useEffect(() => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (!refreshToken) {
      if (token) clearTokens()
      return
    }

    refreshAccessToken().then((success) => {
      if (success) scheduleRefresh()
    })

    return clearRefreshTimer
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
