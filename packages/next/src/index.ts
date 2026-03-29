// Configuration
export { initSpreeNext, getClient, getConfig } from './config';
export type { SpreeNextConfig, SpreeNextOptions } from './types';

// Auth helpers (token refresh, cookie-based auth)
export { withAuthRefresh, getAuthOptions } from './auth-helpers';

// Cookie management
export {
  getCartToken,
  getCartId,
  setCartCookies,
  clearCartCookies,
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  getRefreshToken,
  setRefreshToken,
  clearRefreshToken,
  getCartOptions,
  requireCartId,
} from './cookies';

// Locale resolution (reads country/locale from cookies)
export { getLocaleOptions } from './locale';
