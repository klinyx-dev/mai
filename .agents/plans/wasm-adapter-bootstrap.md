# Implementation Plan: WASM Adapter Bootstrap

## Overview
Build the first adapter-facing layer on top of the completed Phase 1 core so web consumers can call the scheduling engine through a narrow, serializable boundary.

This follows TM6 in `docs/technical_spec.md` and is the next near-term step after `project-bootstrap.md`.

## Architecture Decisions
- Keep the Rust core unchanged as the source of truth.
- Add adapter code under `core/src/adapters/wasm/` first, not mixed into domain/application modules.
- Prefer serializable request/response DTOs and stable error mapping over exposing internal Rust structures directly.
- Keep the first adapter surface minimal: command in, result out, weekly query in, layout out.

## Phase 1: Adapter Boundary Definition

### Task 1: Define WASM-facing request/response contract
- Decide whether exports take JSON strings or strongly typed wasm-bindgen structs.
- Standardize success/error payloads around existing DTOs and `SchedulerError`.
- Record any contract decisions if they constrain future adapters.

Decision recorded:
- Use JSON strings at the exported WASM boundary, not wasm-bindgen-owned request structs.
- Wrap mutations in `WasmCommandRequest` (`command` + `payload`) and queries in `WasmQueryRequest` (`query` + `payload`).
- Wrap all responses in `WasmResponse<T>` with `status = success|error`.
- Reuse core DTOs inside payloads and reuse `SchedulerError` unchanged inside error responses.

Acceptance criteria:
- One documented boundary format exists for commands, queries, and errors.
- Contract does not leak internal module paths or mutable state.

Verification:
- Add contract examples or tests for serialized input/output shapes.

### Task 2: Add minimal adapter state wrapper
- Create a WASM-facing wrapper around `SchedulerService`.
- Expose constructor + core mutation/query entrypoints.
- Keep core logic delegated to `SchedulerService`.

Acceptance criteria:
- Web consumer can instantiate service state and call the five mutations plus weekly layout query.
- No business rules are duplicated in adapter code.

Verification:
- `cargo test`
- adapter-focused unit tests if possible

## Phase 2: Serialization and Error Mapping

### Task 3: Implement adapter-safe error conversion
- Convert internal errors into consistent adapter responses.
- Preserve machine-readable error categories/codes.

Decision recorded:
- Introduce `WasmAdapterError { category, code, message }` as the only adapter error payload.
- Map `SchedulerError` variants to deterministic snake_case codes.
- Treat malformed JSON as `category = contract` with `code = invalid_json`.
- Ensure JSON entrypoints always return serialized success/error envelopes (no transport-level parse errors).

Acceptance criteria:
- All mutation/query failures return stable, parseable error payloads.
- Error mapping is deterministic and tested.

Verification:
- Add tests covering structural, referential, and business errors.

### Task 4: Add adapter examples and usage notes
- Extend docs with example JS/TS or JSON request/response flows.
- Keep examples aligned with `docs/adapter_payload_examples.md`.

Acceptance criteria:
- A consumer can see how to initialize adapter state, submit a command, and read weekly layout output.

Verification:
- README/docs updated

## Risks and Mitigations
- Risk: exposing unstable internals through wasm-bindgen types.
  - Mitigation: prefer a narrow serialized boundary first.
- Risk: duplicated validation or state logic in adapter layer.
  - Mitigation: adapter delegates to `SchedulerService` only.
- Risk: early JS-facing API churn.
  - Mitigation: keep first exported surface small and versionable.

## Definition of Done
- A minimal WASM adapter exists under `core/src/adapters/wasm/`.
- Core commands and weekly layout can be invoked through the adapter boundary.
- Error handling is stable and documented.
- Tests/docs cover the exported flow.
