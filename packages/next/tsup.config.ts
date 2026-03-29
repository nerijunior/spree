import { defineConfig } from 'tsup';

export default defineConfig([
  // Core modules — config, types, auth helpers, cookies, locale
  {
    entry: {
      index: 'src/index.ts',
      config: 'src/config.ts',
      types: 'src/types.ts',
      locale: 'src/locale.ts',
      'auth-helpers': 'src/auth-helpers.ts',
      cookies: 'src/cookies.ts',
    },
    format: ['esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    treeshake: true,
    external: ['next', 'next/cache', 'next/headers', '@spree/sdk', 'react'],
  },
  // Middleware — separate entry (Edge runtime, no next/headers)
  {
    entry: {
      middleware: 'src/middleware.ts',
    },
    format: ['esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    external: ['next', 'next/server', '@spree/sdk'],
  },
  // Webhooks — separate entry (uses next/server + @spree/sdk/webhooks)
  {
    entry: {
      webhooks: 'src/webhooks.ts',
    },
    format: ['esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    external: ['next', 'next/server', '@spree/sdk', '@spree/sdk/webhooks'],
  },
]);
