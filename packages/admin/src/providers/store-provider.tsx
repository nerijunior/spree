import type { Store } from '@spree/admin-sdk'
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import { adminClient } from '@/client'

interface StoreContextValue {
  store: Store | null
  storeId: string
  isLoading: boolean
  currencies: string[]
  locales: string[]
  defaultCurrency: string
  defaultLocale: string
  refetch: () => Promise<void>
}

const StoreContext = createContext<StoreContextValue | null>(null)

export function StoreProvider({ storeId, children }: { storeId: string; children: ReactNode }) {
  const [store, setStore] = useState<Store | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // biome-ignore lint/correctness/useExhaustiveDependencies: adminClient resolves the store from the route's storeId, so we must refetch when it changes
  const fetchStore = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await adminClient.store.get()
      setStore(data)
    } catch {
      setStore(null)
    } finally {
      setIsLoading(false)
    }
  }, [storeId])

  useEffect(() => {
    fetchStore()
  }, [fetchStore])

  const currencies = store?.supported_currencies ?? []
  const locales = store?.supported_locales ?? []
  const defaultCurrency = store?.default_currency ?? 'USD'
  const defaultLocale = store?.default_locale ?? 'en'

  return (
    <StoreContext.Provider
      value={{
        store,
        storeId,
        isLoading,
        currencies,
        locales,
        defaultCurrency,
        defaultLocale,
        refetch: fetchStore,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore(): StoreContextValue {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}
