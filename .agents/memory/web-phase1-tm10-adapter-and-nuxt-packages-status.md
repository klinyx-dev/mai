# Web Phase 1 Status: TM10 Adapter Exposure + Nuxt-First Package Scaffold

## Date
2026-04-21

## Scope Completed
- Exposed TM10 weekly query fields at wasm adapter boundary.
- Added adapter-level deterministic error mapping verification for invalid visible windows.
- Scaffolded a web workspace with framework-agnostic core package and Nuxt-compatible Vue UI package.

## What Shipped

### 1) TM10 adapter query exposure
- `WasmWeeklyLayoutQuery` now supports optional:
  - `assignee_id`
  - `visible_start_minute`
  - `visible_end_minute`
  - existing `anchor_date` + optional `timezone`
- Adapter query execution now calls checked service query API and returns typed structural errors for invalid windows.

### 2) Adapter tests and smoke coverage
- Updated rust serialization and wrapper tests to include TM10 query fields.
- Added invalid visible-window contract assertion:
  - `status = error`
  - `category = structural`
  - `code = invalid_visible_window`
- Updated generated wasm package smoke script payload flow to include TM10 query fields and invalid-window assertion.

### 3) Web package scaffold (Nuxt-first, reusable)
- Added `web/` workspace with:
  - `@mai/scheduler-web-core` (framework-agnostic TypeScript contract/helpers)
  - `@mai/scheduler-ui-vue` (Nuxt-compatible Vue package, opinionated CSS theme)
  - `web/examples/nuxt-app` integration skeleton (client plugin + page)
- Backend-authoritative architecture is documented in workspace README.

## Notes
- This phase provides package structure and starter APIs; production-grade component breadth and visual system expansion can proceed incrementally in subsequent tasks.
