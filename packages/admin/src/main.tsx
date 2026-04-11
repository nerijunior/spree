import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useAuth } from '@/hooks/use-auth'
import { queryClient } from '@/lib/query-client'
import { AuthProvider } from '@/providers/auth-provider'
import { PermissionProvider, usePermissions } from '@/providers/permission-provider'
import { router } from '@/router'
import './index.css'

function InnerApp() {
  const auth = useAuth()
  const { permissions } = usePermissions()
  return <RouterProvider router={router} context={{ auth, permissions }} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PermissionProvider>
          <TooltipProvider>
            <InnerApp />
          </TooltipProvider>
        </PermissionProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
