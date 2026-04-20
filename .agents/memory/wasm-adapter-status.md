# WASM Adapter Status Memory

## Date
2026-04-20

## Scope Summary
This memory captures the completed state of the WASM adapter bootstrap work.

## Completed

### Task 1: WASM-facing contract
- Adopted JSON-string boundary for adapter IO.
- Defined request envelopes:
  - `WasmCommandRequest` (`command` + `payload`)
  - `WasmQueryRequest` (`query` + `payload`)
- Defined shared response envelope:
  - `WasmResponse<T>` with `status = success|error`

### Task 2: Minimal adapter state wrapper
- Added `WasmSchedulerAdapter` owning `SchedulerService`.
- Added command/query delegation methods:
  - `execute_command`
  - `execute_query`
  - `execute_command_json`
  - `execute_query_json`
- Kept business logic in `SchedulerService` only.

### Task 3: Adapter-safe error conversion
- Introduced `WasmAdapterError { category, code, message }`.
- Added deterministic mapping from `SchedulerError` to adapter-safe categories/codes.
- Added contract parse error mapping:
  - malformed JSON => `category = contract`, `code = invalid_json`
- JSON entrypoints now always return serialized response envelopes (no parse error escape).

### Task 4: Examples and usage notes
- Kept canonical payloads in `docs/adapter_payload_examples.md`.
- Added end-to-end consumer guidance in `docs/wasm_adapter_usage.md`.
- Linked usage docs from `README.md`.

## Current Contract Baseline
- Commands and queries are envelope-based JSON.
- Success response uses `{ "status": "success", "data": ... }`.
- Error response uses `{ "status": "error", "error": { "category", "code", "message" } }`.
- Core internal types and module paths are not exposed as mutable JS-facing state.

## Verification State
- Adapter and contract tests are passing in `core/tests/serialization_contract.rs`.
- Full `cargo test` for `core` is passing after Task 3 implementation.

## Follow-up Milestones
- TM6b export wrapper completion is tracked in:
  - `.agents/memory/wasm-bindgen-export-status.md`
- TM6c package consumption completion is tracked in:
  - `.agents/memory/wasm-package-consumption-status.md`

## Primary References
- Contract implementation: `core/src/adapters/wasm/mod.rs`
- Contract examples: `docs/adapter_payload_examples.md`
- Usage notes: `docs/wasm_adapter_usage.md`
