# Core calendar filter system status

Date: 2026-04-30

Implemented scope:
- Defined owner-based calendar filter semantics in specs (`all`, `none`, `owners`, `group`).
- Replaced raw owner-id filtering in Rust weekly layout with explicit `CalendarOwnerFilter`.
- Extended WASM boundary mapping for `none` and deterministic empty-owner handling.
- Updated `@mai/mai-web-core` filter contract to a canonical discriminated union.
- Aligned `@mai/mai-ui-vue` filter typing and runtime filter payload validation.
- Updated Nuxt example to demonstrate all/none/multi-owner calendar filtering.
- Documented filter contract across workspace and package docs.

Commits:
- `f26498b` docs: specify core calendar filter semantics
- `86a4108` add: model core calendar owner filters
- `4c6fdd8` add: map calendar filters through wasm query boundary
- `a4bc5c7` add: expose typed weekly calendar filters
- `5ca773c` add: align ui calendar filters with core contract
- `3a82c81` add: demonstrate owner calendar filters in example app
- `2cc5d4c` docs: document calendar filter contract

Verification performed:
- `cargo test` (core) after Rust contract and boundary changes.
- `pnpm --filter @mai/mai-web-core build`
- `pnpm --filter @mai/mai-web-core test`
- `pnpm --filter @mai/mai-ui-vue build`
- `pnpm --filter @mai/mai-ui-vue test`
- `pnpm --filter @mai/nuxt-app-example build`

Notes:
- Group filtering remains a boundary concern; consuming apps must resolve group ids to owner ids before core query execution.
- Appointment visibility continues to follow slot owner filtering semantics.
