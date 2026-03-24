---
"@spree/next": minor
---

Split discount codes and gift cards into separate server actions. Rename coupon actions and add dedicated gift card actions.

- `applyDiscountCode(code)` — apply promotion discount code (replaces `applyCoupon`)
- `removeDiscountCode(code)` — remove discount code (replaces `removeCoupon`)
- `applyGiftCard(code)` — apply gift card to cart (new)
- `removeGiftCard(giftCardId)` — remove gift card by prefixed ID (new)
