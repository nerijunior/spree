import { createRouter } from '@tanstack/react-router'
import type { Permissions } from '@/providers/permission-provider'
import { routeTree } from './routeTree.gen'

export const router = createRouter({
  routeTree,
  context: {
    auth: undefined!,
    permissions: undefined! as Permissions,
  },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
