---
"@spree/sdk": patch
---

Remove `created_at` and `updated_at` from Store API responses. These internal timestamps are now only available in Admin API responses. Business timestamps like `completed_at` and `expires_at` are unchanged.
