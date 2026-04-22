# Memory: Web WASM Runtime Boundary (Completed 2026-04-22)

## Outcome
The web integration now follows package-first consumption:
- app source consumes `@mai/mai-wasm-adapter` instead of direct `core/pkg` imports.
- `@mai/mai-web-core` remains runtime-agnostic (contracts + JSON client helpers).
- wasm bootstrap concerns are isolated in `@mai/mai-wasm-adapter`.

## Delivered phases
1. Phase 1: contract and package boundary documented in technical/web docs.
2. Phase 2: `@mai/mai-wasm-adapter` implemented with `createWasmAdapter()`.
3. Phase 3: Nuxt example refactored to package-level adapter usage.
4. Phase 4: regression hardening via package tests + boundary smoke check.
5. Phase 5: docs and migration notes finalized.

## Verification baseline
- `pnpm run build` in `web/` passes.
- `pnpm run test` in `web/` passes.
- boundary check script fails on direct `core/pkg` imports in app source.

## Follow-up
- If future apps need custom wasm asset locations, keep that concern in `@mai/mai-wasm-adapter` API only.
