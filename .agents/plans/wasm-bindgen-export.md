# Implementation Plan: WASM Bindgen Export Layer

## Overview
Expose the existing JSON-based WASM adapter wrapper as real web-consumable exports using `wasm-bindgen`, without modifying core scheduling logic.

This follows TM6b in `docs/technical_spec.md` after completing the adapter contract/state/error phases.

## Scope
- In scope: export surface, crate config for wasm target, JS-facing smoke verification, docs updates.
- Out of scope: changing command/query/error JSON shapes, adding new business rules, changing `SchedulerService`.

## Phase 1: Export Surface

### Task 1: Add wasm-bindgen export wrapper
- Add a wasm-exported struct that owns `WasmSchedulerAdapter`.
- Export constructor + JSON entrypoints for command/query execution.
- Keep method behavior as passthrough to existing adapter wrapper.

Acceptance criteria:
- Web consumer can instantiate exported adapter and call two JSON methods.
- Exported methods preserve current response envelopes.

Verification:
- `cargo test`
- compile check for wasm target (`wasm32-unknown-unknown`)

### Task 2: Keep boundary compatibility explicit
- Ensure exported names and signatures are stable and documented.
- Confirm no internal module paths/types leak into JS-facing contract.

Acceptance criteria:
- JS/TS consumer only needs JSON strings and returned JSON strings.
- Existing adapter payload docs remain valid with no schema change.

Verification:
- contract tests unchanged/green
- docs references updated

## Phase 2: Consumer Validation and Docs

### Task 3: Add web-consumer smoke example/test
- Add minimal example (or integration smoke) showing:
  - instantiate exported adapter
  - execute one command
  - execute weekly query
  - parse success/error response envelopes

Acceptance criteria:
- A consumer-facing flow is runnable or copy-pasteable and consistent with docs.

Verification:
- run relevant tests/checks

### Task 4: Finalize docs and workflow artifacts
- Update usage docs with actual wasm export names/import style.
- Summarize outcomes in `.agents/memory/`.
- Remove completed bootstrap plan files from `.agents/plans/` when fully superseded.

Acceptance criteria:
- Docs match exported surface exactly.
- Workflow rule steps 5 and 6 are satisfied.

## Risks and Mitigations
- Risk: accidental contract drift while adding exports.
  - Mitigation: reuse existing adapter wrapper methods and contract tests.
- Risk: wasm-target build setup surprises.
  - Mitigation: keep config minimal and verify with target-specific compile checks early.

## Commit Checkpoints
1. `docs: lock technical spec for wasm-bindgen export layer`
2. `feat: add wasm-bindgen exports over adapter wrapper`
3. `test/docs: add web-consumer smoke path and usage updates`
4. `docs: finalize memory summary and cleanup completed plan artifacts`
