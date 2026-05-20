# Phase 1 Contract Hardening Status

Date: 2026-05-20
Status: completed

## Completed Outcomes

- Added public API inventory:
  - `docs/public_api_inventory.md`
- Added API compatibility policy:
  - `docs/api_compatibility.md`
- Completed payload catalog across all public commands and queries:
  - `docs/adapter_payload_examples.md`
- Completed adapter error catalog with all stable codes:
  - `docs/adapter_error_codes.md`
- Added package compatibility matrix:
  - `docs/compatibility_matrix.md`
- Added migration note template:
  - `docs/migration_guide_template.md`
- Updated release and contributor docs:
  - `docs/release_process.md`
  - `README.md`
  - `README-dev.md`

## Contract Test Hardening

- Added stable wasm contract fixtures:
  - `core/tests/fixtures/command_add_slot.json`
  - `core/tests/fixtures/query_weekly_layout_filtered.json`
  - `core/tests/fixtures/response_success_applied.json`
  - `core/tests/fixtures/response_error_slot_already_booked.json`
- Added fixture-backed assertions in:
  - `core/tests/serialization_contract.rs`
- Added TypeScript export boundary tests:
  - `web/packages/mai-web-core/tests/public-api.test.mjs`
  - `web/packages/mai-wasm-adapter/tests/public-api.test.mjs`
  - updated `web/packages/mai-ui-vue/tests/public-api.test.mjs`

## Verification Ran

- `cargo fmt --all --check` (required formatting changes; then ran `cargo fmt --all`)
- `cargo clippy --all-targets --all-features -- -D warnings`
- `cargo test`
- `cargo check --target wasm32-unknown-unknown -p mai`
- `core/tests/run_generated_package_smoke.sh`
- `cd web && pnpm run build`
- `cd web && pnpm run test`

All verification commands passed.
