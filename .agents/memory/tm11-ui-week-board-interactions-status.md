# Memory: TM11 UI Week Board Interactions (Completed 2026-04-22)

## Outcome
`@mai/mai-ui-vue` now provides a reusable week-view contract suitable for real app consumption:
- full-day timeline by default (`0..1440`),
- configurable visible window and `12h/24h` labels,
- typed interaction emits for slot/appointment/empty-cell actions,
- refactored internal primitives under `src/board/`.

## Delivered phases
1. Phase 1: UI prop/event contract defined and exported types added.
2. Phase 2: `MaiBoard` decomposed into internal primitives and shared view model.
3. Phase 3: full-day default timeline + configurable visible window implemented.
4. Phase 4: interaction events wired with keyboard-accessible event activation.
5. Phase 5: visual consistency pass across spacing/typography/states.
6. Phase 6: tests, example integration, and docs completed.

## Verification baseline
- `cd web && pnpm run build` passes.
- `cd web && pnpm run test` passes and includes:
  - `@mai/mai-web-core` tests,
  - `@mai/mai-wasm-adapter` tests,
  - `@mai/mai-ui-vue` tests,
  - boundary smoke check.

## Notes
- Header/time rendering remains in UI package by design; Rust core remains headless and semantic.
