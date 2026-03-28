---
"@spree/sdk": patch
---

Rename metafields to custom_fields in Store API. The expand parameter changes from `metafields` to `custom_fields`, and the response key changes accordingly. Prefix IDs change from `mf_` to `cf_`. The `StoreMetafield` type is replaced by `StoreCustomField`.
