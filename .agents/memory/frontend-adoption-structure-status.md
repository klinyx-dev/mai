# Frontend Adoption and Structure Status

Date: 2026-05-26
Status: completed

## Completed Outcomes

- Added framework-agnostic frontend client wrapper:
  - `createMaiClient(adapter)`
  - `MaiClient`
  - client methods for command execution, weekly layout query, booking a slot, and response parsing
- Updated Vue integration to use the web-core client internally while preserving `useMai` behavior.
- Added frontend-only adoption guide:
  - `docs/frontend_adoption_guide.md`
- Updated roadmap and product quality spec to replace backend/database guidance with frontend adoption guidance.
- Updated root and package READMEs with package role and adoption guidance.
- Added `@mai/mai-wasm-adapter` package README.
- Hardened example app boundary checks against generated-wasm and package-internal deep imports.

## Verification Ran

- `pnpm -C mai/web --filter @mai/mai-web-core build`
- `pnpm -C mai/web --filter @mai/mai-ui-vue build`
- `pnpm -C mai/web --filter @mai/mai-web-core test`
- `pnpm -C mai/web --filter @mai/mai-ui-vue test`
- `pnpm -C mai/web run test:boundary`
- `pnpm -C mai/web run build`
- `pnpm -C mai/web run test`
- `./scripts/verify-local.sh`

Notes:
- The first sandboxed `./scripts/verify-local.sh` run failed at the wasm-pack wasm-bindgen step with `Operation not permitted`.
- Re-running `./scripts/verify-local.sh` outside the sandbox passed.
- Rust tests emitted existing macOS SDK lookup warnings from `xcrun`, but all checks passed.
