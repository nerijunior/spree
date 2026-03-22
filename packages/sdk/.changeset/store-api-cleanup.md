---
"@spree/sdk": minor
---

**Breaking:** Store API endpoint changes requiring backend >= 5.4.0.rc2:

- **Default address:** Removed `markAsDefault()` method. Use `is_default_billing` / `is_default_shipping` booleans on `create()` and `update()` instead (Medusa/Vendure pattern)
- **Removed redundant endpoints:** `carts.paymentMethods.list()`, `carts.payments.list()`, `carts.payments.get()` — payment methods and payments are included in the cart response
- **`AddressParams`** now includes `is_default_billing` and `is_default_shipping` fields
- **Address response** now includes `is_default_billing` and `is_default_shipping` fields
