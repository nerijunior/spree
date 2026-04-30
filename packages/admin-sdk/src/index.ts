// Main client

export type { RequestOptions, RetryConfig } from '@spree/sdk-core'
// Request infrastructure (re-export from sdk-core)
export { SpreeError } from '@spree/sdk-core'
export type {
  AuthTokens,
  DashboardAnalytics,
  LoginCredentials,
  MeResponse,
  PermissionRule,
} from './admin-client'
// Admin client class (for advanced use / subclassing)
export { AdminClient } from './admin-client'
export type { AdminClientConfig, Client } from './client'
export { createAdminClient } from './client'

// All types
export * from './types'
