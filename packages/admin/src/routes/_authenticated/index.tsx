import { createFileRoute, redirect } from '@tanstack/react-router'
import { adminClient } from '@/client'

export const Route = createFileRoute('/_authenticated/')({
  beforeLoad: async () => {
    // Fetch the current store to get its prefixed ID for the URL
    try {
      const store = await adminClient.store.get()
      throw redirect({ to: '/$storeId', params: { storeId: store.id } })
    } catch (e) {
      // If it's already a redirect, re-throw
      if (e instanceof Error && 'to' in e) throw e
      // Fallback: use 'default' as store ID
      throw redirect({ to: '/$storeId', params: { storeId: 'default' } })
    }
  },
})
