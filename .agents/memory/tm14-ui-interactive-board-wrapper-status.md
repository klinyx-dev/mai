# TM14 UI Interactive Board Wrapper Status

Date: 2026-04-23

## Completed
- Added `MaiBoardInteractive` wrapper contract to technical spec and implemented it in `@mai/mai-ui-vue`.
- Added centralized interaction constants:
  - `INTERACTION_ACTIONS`
  - `INTERACTION_SUCCESS_EVENTS`
- Added adapter-driven mutation mode (`mutateCommand`) in `MaiBoardInteractive`:
  - uses `COMMANDS + createCommandEnvelope` from `@mai/mai-web-core` internally,
  - preserves callback mode for direct consumer control.
- Added interaction orchestration state utilities in `src/interactive/state.ts`.
- Added interaction orchestration tests in `tests/interactive-board.test.mjs`:
  - empty-cell, slot, and appointment overlay routing,
  - success clears selection and emits expected success event,
  - deterministic error payload emission.
- Migrated Nuxt example to thin-consumer usage with `MaiBoardInteractive`.

## Verification
- `pnpm --filter @mai/mai-ui-vue build`
- `pnpm --filter @mai/mai-ui-vue test`
- `pnpm --filter @mai/nuxt-app-example build`
- `pnpm run test` (web workspace)

## Notes
- Existing `MaiBoard` remains available as a lower-level presentational primitive.
- Interactive orchestration now lives in UI library, reducing app wiring complexity.
