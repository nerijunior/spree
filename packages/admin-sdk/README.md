# @spree/admin-sdk

Official TypeScript SDK for the **Spree Commerce Admin API** — manage products, orders, customers, fulfillments, payments, and store configuration from server-to-server integrations or admin tooling.

> **Developer Preview.** The Admin API is in active development and may change between minor versions. Pin to a specific version of `@spree/admin-sdk` in production and review the [changelog](./CHANGELOG.md) before upgrading.

## Installation

```bash
npm install @spree/admin-sdk
# or
yarn add @spree/admin-sdk
# or
pnpm add @spree/admin-sdk
```

## Quick start

```typescript
import { createAdminClient } from '@spree/admin-sdk'

const client = createAdminClient({
  baseUrl: 'https://store.example.com',
  secretKey: 'sk_xxx',
})

// List orders
const { data: orders, meta } = await client.orders.list({
  status_eq: 'complete',
  sort: '-completed_at',
  limit: 25,
})

// Create an order in one shot
const order = await client.orders.create({
  email: 'customer@example.com',
  currency: 'USD',
  items: [{ variant_id: 'variant_xxx', quantity: 1 }],
  shipping_address: {
    first_name: 'Jane',
    last_name: 'Doe',
    address1: '350 Fifth Avenue',
    city: 'New York',
    postal_code: '10118',
    country_iso: 'US',
    state_abbr: 'NY',
    phone: '+1 212 555 1234',
  },
})

// Manage a customer
const customer = await client.customers.create({
  email: 'jane@example.com',
  first_name: 'Jane',
  last_name: 'Doe',
  tags: ['wholesale'],
})

await client.customers.addresses.create(customer.id, {
  first_name: 'Jane',
  last_name: 'Doe',
  address1: '350 Fifth Avenue',
  city: 'New York',
  postal_code: '10118',
  country_iso: 'US',
  state_abbr: 'NY',
  phone: '+1 212 555 1234',
  is_default_shipping: true,
})
```

## Authentication

The Admin API supports two authentication methods.

### Secret API key (server-to-server)

Use a **secret API key** (`sk_…`) for backend integrations. Each key carries a list of [scopes](https://spreecommerce.org/docs/api-reference/admin-api/authentication#permissions) granted at creation time. Never embed secret keys in client-side code, mobile apps, or public repositories.

```typescript
const client = createAdminClient({
  baseUrl: 'https://store.example.com',
  secretKey: 'sk_xxx',
})
```

### JWT bearer token (admin SPA)

Authenticate as an admin user and use the returned JWT for subsequent requests. JWT-authenticated requests use [CanCanCan abilities](https://github.com/CanCanCommunity/cancancan) instead of scopes.

```typescript
const client = createAdminClient({
  baseUrl: 'https://store.example.com',
  jwtToken: '<jwt>',
})

// Or login interactively:
const tempClient = createAdminClient({ baseUrl, secretKey })
const { token, refresh_token, user } = await tempClient.auth.login({
  email: 'admin@example.com',
  password: 'password123',
})

const adminClient = createAdminClient({ baseUrl, jwtToken: token })
adminClient.onUnauthorized(async () => {
  const { token: fresh } = await tempClient.auth.refresh({ token: refresh_token })
  adminClient.setToken(fresh)
  return true
})
```

## Resource clients

Top-level resources:

| Client | Endpoints |
|---|---|
| `client.orders` | List, get, create, update, delete, complete, cancel, approve, resume, resend confirmation. Nested: `items`, `payments`, `fulfillments`, `refunds`, `giftCards`, `storeCredits`, `adjustments`. |
| `client.customers` | List, get, create, update, delete. Nested: `addresses`, `creditCards`, `storeCredits`. |
| `client.products` | List, get, create, update, delete. Nested: `media`, `variants` (which also has `media`). |
| `client.variants` | Top-level variant search across products. |
| `client.optionTypes` | CRUD on option types and values. |
| `client.categories` | List and read categories. |
| `client.paymentMethods` | List and read configured payment methods. |
| `client.taxCategories` | List and read tax categories. |
| `client.countries` | List and read countries (for address dropdowns). |
| `client.tags` | Autocomplete tag names per taggable type. |
| `client.dashboard` | Sales analytics. |
| `client.store` | Store profile. |
| `client.me` | Current admin user + permissions. |
| `client.auth` | Login, refresh. |
| `client.directUploads` | Pre-signed Active Storage uploads (used by media flows). |

## Querying

Collection endpoints support [Ransack](https://activerecord-hackery.github.io/ransack/) filters via flat parameters:

```typescript
const orders = await client.orders.list({
  status_eq: 'complete',
  total_gteq: 100,
  email_cont: '@example.com',
  user_id_eq: 'cus_xxx',           // resource IDs work directly
  sort: '-completed_at',
  page: 2,
  limit: 50,
  expand: ['items', 'customer'],
})
```

The SDK wraps filter keys in `q[…]` automatically.

## Error handling

Every non-2xx response throws a `SpreeError`:

```typescript
import { SpreeError } from '@spree/admin-sdk'

try {
  await client.orders.update(orderId, { email })
} catch (err) {
  if (err instanceof SpreeError) {
    console.log(err.code)    // e.g. 'cart_already_updated'
    console.log(err.status)  // e.g. 409
    console.log(err.details) // optional structured context
  }
}
```

When a request fails because the API key lacks the required scope, the error has `code: 'access_denied'` and `details.required_scope` carries the missing scope name.

## TypeScript support

Full TypeScript support with generated types from the API serializers:

```typescript
import type {
  AdminOrder,
  AdminProduct,
  AdminCustomer,
  AdminFulfillment,
  AdminPayment,
  PaginatedResponse,
} from '@spree/admin-sdk'

const orders: PaginatedResponse<AdminOrder> = await client.orders.list()
const product: AdminProduct = await client.products.get('prod_xxx')
```

Admin types are exported with the `Admin` prefix to distinguish them from the customer-facing `@spree/sdk` types (which use `Store` prefixes for the same domain entities). Admin types include fields and relationships hidden from the Store API.

## Custom fetch

You can provide a custom fetch implementation:

```typescript
const client = createAdminClient({
  baseUrl: 'https://store.example.com',
  secretKey: 'sk_xxx',
  fetch: customFetchImplementation,
})
```

## Documentation

- **Full API reference:** [spreecommerce.org/docs/api-reference/admin-api](https://spreecommerce.org/docs/api-reference/admin-api/introduction)
- **Authentication & scopes:** [spreecommerce.org/docs/api-reference/admin-api/authentication](https://spreecommerce.org/docs/api-reference/admin-api/authentication)
- **Errors:** [spreecommerce.org/docs/api-reference/admin-api/errors](https://spreecommerce.org/docs/api-reference/admin-api/errors)
- **Querying:** [spreecommerce.org/docs/api-reference/admin-api/querying](https://spreecommerce.org/docs/api-reference/admin-api/querying)

## Development

### Setup

```bash
cd packages/admin-sdk
pnpm install
```

### Scripts

| Command | Description |
|---|---|
| `pnpm test` | Run tests once |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm typecheck` | Type-check with `tsc --noEmit` |
| `pnpm lint` | Lint with Biome |
| `pnpm lint:fix` | Lint and auto-fix with Biome |
| `pnpm format` | Format source with Biome |
| `pnpm build` | Build CJS + ESM bundles with `tsup` |
| `pnpm dev` | Build in watch mode |
| `pnpm generate:admin-client` | Regenerate the resource client from the OpenAPI spec |

### Type generation pipeline

When the upstream Admin API serializers in `spree/api` change, regenerate types from the monorepo root:

```bash
# 1. Regenerate TypeScript types from Alba serializers
cd spree/api && bundle exec rake typelizer:generate

# 2. Rebuild the SDK (consumes the generated types)
cd packages/admin-sdk && pnpm build

# 3. Run tests to confirm nothing broke
pnpm test
```

Generated TypeScript types land in `src/types/generated/`; do not edit by hand.

### Releasing

This package uses [Changesets](https://github.com/changesets/changesets) for version management and publishing.

**After making changes:**

```bash
pnpm changeset
```

This prompts you to select a semver bump type (patch/minor/major) and write a summary. A changeset file is created in `.changeset/`.

**How releases work:**

1. Changeset files are committed with your PR
2. When merged to `main`, a GitHub Action creates a "Version Packages" PR that bumps the version and updates the CHANGELOG
3. When that PR is merged, the package is automatically published to npm under the `next` dist-tag (Developer Preview), so `npm install @spree/admin-sdk` does not pick it up as `latest`

**Manual release (if needed):**

```bash
pnpm version   # Apply changesets and bump version
pnpm release   # Build and publish to npm
```

## License

MIT
