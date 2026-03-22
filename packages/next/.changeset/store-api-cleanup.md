---
"@spree/next": minor
---

**Breaking:** Removed `getFulfillments()` server action — fulfillments are included in the cart response. Use `cart.fulfillments` instead.

Requires `@spree/sdk` >= 0.12.0.
