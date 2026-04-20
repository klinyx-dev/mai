# Implementation Plan: WASM Package Consumption

## Overview
Make the existing wasm-bindgen export layer straightforward to consume from JavaScript by verifying package build output, import shape, and end-to-end initialization flow.

This follows TM6c in `docs/technical_spec.md` after the adapter contract, wrapper, error mapping, and wasm-bindgen exports are complete.

## Why This Is Next
- The exported adapter exists, but the repo does not yet prove a real JS consumer can build/import it from generated wasm package output.
- This closes the gap between "compiles for wasm" and "usable from web tooling".
- It exercises packaging and consumption without reopening core API design.

## Scope
- In scope: wasm package build configuration, JS import smoke path, usage docs for generated package consumption.
- Out of scope: UI work, new scheduling features, request/response schema changes, business-rule changes.

## Phase 1: Package Build Shape

### Task 1: Define package build contract
- Decide expected tool and output shape for near-term consumption (`wasm-pack` is the default candidate).
- Lock the expected generated import pattern (`init` + `WasmBindgenAdapter`).
- Record any crate metadata/config needed for wasm package generation.

Acceptance criteria:
- One documented package build path exists.
- Consumer-facing import style is explicit and stable enough for docs/tests.

Verification:
- docs/spec updated

### Task 2: Add package-compatible crate config
- Add any required crate-type or metadata changes for wasm package generation.
- Keep non-wasm native workflows unaffected.

Acceptance criteria:
- Crate remains testable natively.
- Crate is ready for wasm package build tooling.

Verification:
- `cargo test`
- wasm-target check/build command

## Phase 2: JS Consumer Smoke Path

### Task 3: Add generated-package smoke validation
- Add a minimal JS-facing smoke path that verifies:
  - module initialization
  - adapter construction
  - one command
  - one query
  - JSON envelope parsing

Acceptance criteria:
- The repo proves a JS consumer can use the generated package shape.

Verification:
- run relevant smoke test/build step

### Task 4: Finalize usage docs
- Update docs with the exact build/import/run path for generated package consumers.
- Keep docs aligned with the actual package tool/output.

Acceptance criteria:
- A consumer can follow the repo docs to build and import the wasm package.

## Risks and Mitigations
- Risk: package tool friction obscures adapter correctness.
  - Mitigation: keep smoke path minimal and focused on initialization/import contract.
- Risk: native workflows regress due to wasm packaging config.
  - Mitigation: verify native `cargo test` remains green after config changes.

## Commit Checkpoints
1. `docs: lock tm6c wasm package consumption contract`
2. `build: add wasm package-compatible crate config`
3. `test: add js package smoke path`
4. `docs: finalize wasm package consumption notes`
