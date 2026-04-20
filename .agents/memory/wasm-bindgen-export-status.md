# WASM Bindgen Export Status Memory

## Date
2026-04-20

## Scope
Track completion of TM6b: exporting the existing JSON adapter wrapper to web-consumable wasm-bindgen methods.

## Completed Outcomes

1. Export wrapper implemented
- Added `WasmBindgenAdapter` in `core/src/adapters/wasm/mod.rs`.
- Export surface is JSON-only:
  - `new()`
  - `execute_command_json(&str) -> String`
  - `execute_query_json(&str) -> String`

2. Build configuration
- Added target-specific dependency:
  - `wasm-bindgen` under `target.'cfg(target_arch = "wasm32")'.dependencies` in `core/Cargo.toml`.

3. Contract compatibility guard
- Added compile-time signature guard test in `core/tests/serialization_contract.rs` to prevent API drift from JSON-only IO signatures.

4. Web-consumer smoke coverage
- Added `core/tests/wasm_web_smoke.rs`:
  - instantiate adapter
  - add slot + add appointment via JSON commands
  - query weekly layout via JSON query
  - verify both success and business error envelopes

5. Documentation updates
- Updated `docs/wasm_adapter_usage.md`:
  - explicit exported names
  - compatibility contract notes
  - JS import/initialize example

## Verification Snapshot
- `cargo test --test serialization_contract`: passed
- `cargo test --test wasm_web_smoke`: passed
- `cargo test`: passed
- `cargo check --target wasm32-unknown-unknown`: passed

## Contract Baseline (unchanged)
- Requests:
  - command: `{ "command": "...", "payload": ... }`
  - query: `{ "query": "...", "payload": ... }`
- Responses:
  - success: `{ "status": "success", "data": ... }`
  - error: `{ "status": "error", "error": { "category", "code", "message" } }`

## Notes
- This memory supersedes earlier wasm adapter planning context.
