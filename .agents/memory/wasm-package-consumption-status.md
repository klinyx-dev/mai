# WASM Package Consumption Status Memory

## Date
2026-04-20

## Scope
Track completion of TM6c: generated package build/consumption verification for real JS consumers.

## Completed Outcomes

1. Package build contract locked
- Documented canonical build command:
  - `wasm-pack build --target web --out-dir pkg --out-name mai`
- Documented generated output contract:
  - `pkg/mai.js`
  - `pkg/mai_bg.wasm`
  - `pkg/mai.d.ts`
  - `pkg/package.json`

2. Package-compatible crate config
- Added crate type configuration in `core/Cargo.toml`:
  - `[lib] crate-type = ["cdylib", "rlib"]`
- Preserved native build/test compatibility.

3. Generated-package JS smoke validation
- Added Node ESM consumer smoke script:
  - `core/tests/generated_package_smoke.mjs`
- Added runner command:
  - `core/tests/run_generated_package_smoke.sh`
- Smoke path verifies:
  - wasm module initialization
  - `WasmBindgenAdapter` construction
  - one command + one query
  - success/error JSON envelope parsing

4. Usage docs aligned to actual package path
- Updated `docs/wasm_adapter_usage.md` with:
  - package build contract
  - generated-package smoke command

## Verification Snapshot
- `cargo test`: passed
- `cargo check --target wasm32-unknown-unknown -p mai`: passed
- `core/tests/run_generated_package_smoke.sh`: passed

## Contract Baseline (unchanged)
- Requests:
  - command: `{ "command": "...", "payload": ... }`
  - query: `{ "query": "...", "payload": ... }`
- Responses:
  - success: `{ "status": "success", "data": ... }`
  - error: `{ "status": "error", "error": { "category", "code", "message" } }`

## Notes
- This memory supersedes planning context in:
  - `.agents/plans/wasm-package-consumption.md`
- Technical milestone TM6c is now complete.
