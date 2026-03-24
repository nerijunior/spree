---
"@spree/sdk": minor
---

Split discount codes and gift cards into separate cart endpoints. Rename `couponCodes` to `discountCodes` and add dedicated `giftCards` resource.

- `client.carts.discountCodes.apply(cartId, code)` — apply promotion discount code (was `couponCodes.apply`)
- `client.carts.discountCodes.remove(cartId, code)` — remove discount code (was `couponCodes.remove`)
- `client.carts.giftCards.apply(cartId, code)` — apply gift card (new)
- `client.carts.giftCards.remove(cartId, giftCardId)` — remove gift card by prefixed ID (new)

Cart and Order types now include `amount_due` and `display_amount_due` — the amount the customer still owes after store credits/gift cards are applied.
