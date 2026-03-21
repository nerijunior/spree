---
"@spree/sdk": patch
---

Add `description_html` field to Product type. The `description` field now returns plain text (HTML tags stripped), while `description_html` returns the raw HTML. This aligns Product with the existing Category pattern.
