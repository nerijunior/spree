# @spree/next

Next.js integration for Spree Commerce — cookie-based auth, middleware, and webhook helpers.

Provides the server-side plumbing for building a Next.js storefront with `@spree/sdk`: JWT token lifecycle (proactive refresh, 401 retry), httpOnly cookie management, locale/country detection middleware, and webhook signature verification.

## Installation

```bash
npm install @spree/next @spree/sdk
# or
pnpm add @spree/next @spree/sdk
```

## Quick Start

### 1. Set environment variables

```env
SPREE_API_URL=https://api.mystore.com
SPREE_PUBLISHABLE_KEY=your-publishable-api-key
```

The client auto-initializes from these env vars. Alternatively, initialize explicitly:

```typescript
import { initSpreeNext } from '@spree/next';

initSpreeNext({
  baseUrl: process.env.SPREE_API_URL!,
  publishableKey: process.env.SPREE_PUBLISHABLE_KEY!,
});
```

### 2. Call the SDK directly in your server actions

`@spree/next` provides `getClient()` (the SDK singleton), auth helpers, and cookie management. You write server actions that call the SDK directly:

```typescript
'use server';

import { getClient, getLocaleOptions } from '@spree/next';

export async function getProducts(params?: { limit?: number }) {
  const options = await getLocaleOptions(); // reads country/locale from cookies
  return getClient().products.list(params, options);
}
```

### 3. Use auth helpers for authenticated endpoints

```typescript
'use server';

import { getClient, withAuthRefresh } from '@spree/next';

export async function getAddresses() {
  return withAuthRefresh(async (options) => {
    return getClient().customer.addresses.list(undefined, options);
  });
}
```

`withAuthRefresh` reads the JWT from cookies, proactively refreshes if near expiry, and retries once on 401.

### 4. Use cookie helpers for cart operations

```typescript
'use server';

import { getClient, getCartOptions, requireCartId } from '@spree/next';

export async function addToCart(variantId: string, quantity: number) {
  const options = await getCartOptions(); // { spreeToken, token } from cookies
  const cartId = await requireCartId();
  return getClient().carts.items.create(cartId, { variant_id: variantId, quantity }, options);
}
```

## API Reference

### Configuration

```typescript
import { initSpreeNext, getClient, getConfig } from '@spree/next';

// Initialize (or let it auto-init from env vars)
initSpreeNext({
  baseUrl: 'https://api.mystore.com',
  publishableKey: 'pk_xxx',
  cartCookieName: '_spree_cart_token',     // default
  accessTokenCookieName: '_spree_jwt',     // default
  defaultLocale: 'en',
  defaultCurrency: 'USD',
  defaultCountry: 'US',
});

// Get the @spree/sdk Client instance
const client = getClient();
```

### Auth Helpers

```typescript
import { withAuthRefresh, getAuthOptions } from '@spree/next';

// Wrap any authenticated SDK call — handles proactive refresh + 401 retry
const customer = await withAuthRefresh(async (options) => {
  return getClient().customer.get(options);
});

// Or get auth options manually
const options = await getAuthOptions(); // { token: 'jwt...' } or {}
```

### Cookie Management

```typescript
import {
  // Cart cookies
  getCartToken,       // guest cart order token
  getCartId,          // cart prefixed ID
  setCartCookies,     // set both cart ID + token
  clearCartCookies,   // clear cart cookies
  getCartOptions,     // { spreeToken, token } for SDK calls
  requireCartId,      // throws if no cart found

  // Auth cookies
  getAccessToken,     // JWT access token
  setAccessToken,
  clearAccessToken,
  getRefreshToken,    // refresh token
  setRefreshToken,
  clearRefreshToken,
} from '@spree/next';
```

### Locale Resolution

```typescript
import { getLocaleOptions } from '@spree/next';

// Reads country/locale from cookies, falls back to config defaults
const options = await getLocaleOptions();
// { locale: 'en', country: 'us' }
```

### Middleware

Handles URL-based country/locale routing with automatic detection:

```typescript
// middleware.ts
import { createSpreeMiddleware } from '@spree/next/middleware';

export default createSpreeMiddleware({
  defaultCountry: 'us',
  defaultLocale: 'en',
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)'],
};
```

Detection order: cookie → geo headers (Vercel/Cloudflare) → default.

### Webhooks

Handle Spree webhook events with signature verification:

```typescript
// src/app/api/webhooks/spree/route.ts
import { createWebhookHandler } from '@spree/next/webhooks';

export const POST = createWebhookHandler({
  secret: process.env.SPREE_WEBHOOK_SECRET!,
  handlers: {
    'order.completed': async (event) => {
      await sendOrderConfirmationEmail(event.data);
    },
    'order.canceled': async (event) => {
      await sendCancellationEmail(event.data);
    },
  },
});
```

Features:
- HMAC-SHA256 signature verification (via `@spree/sdk/webhooks`)
- Replay protection (rejects timestamps older than 5 minutes)
- Event routing to your handlers by event name
- Supports `waitUntil` for Vercel/Cloudflare serverless execution
- Unhandled events return 200 with `{ handled: false }` (no retries)

## TypeScript

Import types directly from `@spree/sdk`:

```typescript
import type { Product, Cart, Order, Address, Customer, SpreeError } from '@spree/sdk';
```

## Development

```bash
cd packages/next
pnpm install
pnpm dev         # Build in watch mode
pnpm typecheck   # Type-check
pnpm test        # Run tests
pnpm build       # Production build
```

## License

MIT
