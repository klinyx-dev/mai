# Implementation Plan: Core Engine Contract Hardening

## Overview
Improve the Rust core engine by making the command/query contract easier to trust from Rust, wasm, and web callers. This is not a rewrite. The goal is to audit the current implementation against the specs, close contract gaps, and add integration tests for realistic scheduling flows.

## Goals
- Keep the core headless and deterministic.
- Preserve the fixed-slot Phase 1 model.
- Make command/query behavior consistent across native Rust and wasm adapter use.
- Prefer explicit validation errors over panics for user-provided input.
- Strengthen end-to-end tests around booking, cancellation, filtering, and layout output.

## Non-Goals
- No persistence layer.
- No recurrence.
- No partial booking or slot splitting.
- No UI, DOM, CSS, or pixel layout logic.
- No auth system beyond existing actor-based command rules.

## Architecture Decisions
- Treat `docs/functional_spec.md` and `docs/technical_spec.md` as the behavioral source of truth.
- Keep domain types strongly typed in Rust (`SlotId`, `AppointmentId`, `ActorId`) and convert only at adapter boundaries.
- Keep web/wasm DTO changes backward-compatible unless a spec mismatch requires a breaking fix.
- Add tests before or alongside implementation for every behavior gap found during audit.

## Phase 1: Contract Audit

### Task 1: Map implemented commands and queries to specs
**Description:** Compare current core commands, service methods, wasm adapter calls, and layout query behavior against FR-4 through FR-13.

**Acceptance criteria:**
- [ ] Each command/query is marked as implemented, partially implemented, or missing.
- [ ] Any mismatch between code and specs is listed with file references.
- [ ] Breaking vs non-breaking changes are identified.

**Verification:**
- [ ] Audit notes added to this plan or a sibling audit file under `.agents/plans/core-engine-contract/`.

**Dependencies:** None

**Files likely touched:**
- `.agents/plans/core-engine-contract/audit.md`
- `core/src/**`
- `docs/functional_spec.md`
- `docs/technical_spec.md`

**Estimated scope:** Small

### Task 2: Review public exports and adapter-facing DTOs
**Description:** Inspect `core/src/lib.rs`, command structs, layout query structs, wasm adapter types, and generated package smoke tests to confirm the public API is coherent.

**Acceptance criteria:**
- [ ] Public Rust exports expose the intended domain, command, service, and layout types.
- [ ] Adapter-facing JSON contracts have stable command names and predictable payload fields.
- [ ] Any redundant or legacy export is documented before changing.

**Verification:**
- [ ] `cargo test serialization_contract`
- [ ] `core/tests/run_generated_package_smoke.sh`

**Dependencies:** Task 1

**Files likely touched:**
- `core/src/lib.rs`
- `core/src/adapters/wasm/**`
- `core/tests/serialization_contract.rs`
- `core/tests/generated_package_smoke.mjs`

**Estimated scope:** Medium

## Checkpoint: Audit
- [ ] Audit output reviewed.
- [ ] Scope confirmed before behavioral changes.
- [ ] No implementation changes merged without matching tests.

## Phase 2: Validation and Error Consistency

### Task 3: Normalize user-input validation paths
**Description:** Ensure user-provided command/query inputs return deterministic `SchedulerError` variants instead of panicking or silently normalizing invalid state where the spec requires rejection.

**Acceptance criteria:**
- [ ] Invalid visible windows return structural errors.
- [ ] Missing slots, invalid statuses, duplicate active bookings, and forbidden cancellations return stable errors.
- [ ] Existing valid flows keep their current behavior.

**Verification:**
- [ ] `cargo test`
- [ ] Targeted tests for invalid command/query inputs.

**Dependencies:** Task 1

**Files likely touched:**
- `core/src/application/errors.rs`
- `core/src/application/scheduler_service/**`
- `core/src/validation/**`
- `core/src/layout/**`
- `core/tests/end_to_end_flows.rs`

**Estimated scope:** Medium

### Task 4: Verify state mutation atomicity on rejected commands
**Description:** Rejected commands should leave `ScheduleState` unchanged. Add tests around overlap rejection, booking rejected slots, booked-slot deletion, and unauthorized appointment cancellation.

**Acceptance criteria:**
- [ ] Rejected commands do not partially mutate slots or appointments.
- [ ] Slot status remains correct after every rejected booking/cancellation/deletion flow.
- [ ] Tests cover at least one rejected command after a successful prior mutation.

**Verification:**
- [ ] `cargo test end_to_end_flows`

**Dependencies:** Task 3

**Files likely touched:**
- `core/tests/end_to_end_flows.rs`
- `core/src/application/scheduler_service/**`
- `core/src/state/schedule_state.rs`

**Estimated scope:** Medium

## Checkpoint: Validation
- [ ] `cargo fmt --all --check`
- [ ] `cargo clippy --all-targets --all-features -- -D warnings`
- [ ] `cargo test`

## Phase 3: End-to-End Core Flows

### Task 5: Strengthen booking lifecycle tests
**Description:** Add integration tests for complete first-class flows: create slot, book appointment, query weekly layout, cancel/delete appointment, and verify slot availability returns.

**Acceptance criteria:**
- [ ] A booked slot appears as an appointment in weekly layout.
- [ ] Cancelling an appointment removes it and makes the slot available again.
- [ ] Deleting an appointment removes it and makes the slot available again.

**Verification:**
- [ ] `cargo test end_to_end_flows`

**Dependencies:** Task 3

**Files likely touched:**
- `core/tests/end_to_end_flows.rs`
- `core/src/layout/**`

**Estimated scope:** Medium

### Task 6: Strengthen owner-filtered weekly layout tests
**Description:** Verify deterministic owner filtering for slots and appointments, including `all`, `none`, `owners`, and empty-owner behavior.

**Acceptance criteria:**
- [ ] Available slots are filtered by `resource_owner_id`.
- [ ] Appointments are filtered through their referenced slot owner.
- [ ] Empty owner lists deterministically produce no selected owners.

**Verification:**
- [ ] `cargo test weekly`
- [ ] `cargo test end_to_end_flows`

**Dependencies:** Task 5

**Files likely touched:**
- `core/tests/end_to_end_flows.rs`
- `core/src/layout/query_filter.rs`
- `core/src/layout/weekly_layout/**`

**Estimated scope:** Medium

### Task 7: Strengthen visible-window layout tests
**Description:** Cover visible-hour filtering and clipping behavior for slots and appointments that fall inside, outside, and across the visible window.

**Acceptance criteria:**
- [ ] Nodes outside the visible window are excluded.
- [ ] Nodes crossing window boundaries are clipped with deterministic flags.
- [ ] Invalid windows are rejected consistently.

**Verification:**
- [ ] `cargo test weekly`
- [ ] `cargo test`

**Dependencies:** Task 3

**Files likely touched:**
- `core/src/layout/clipping.rs`
- `core/src/layout/output.rs`
- `core/src/layout/weekly_layout/**`
- `core/tests/end_to_end_flows.rs`

**Estimated scope:** Medium

## Checkpoint: Core Flows
- [ ] All lifecycle, filtering, and visible-window tests pass.
- [ ] Layout output ordering is deterministic across repeated runs.
- [ ] No adapter/web changes are required unless contract drift is discovered.

## Phase 4: Adapter Boundary Confirmation

### Task 8: Confirm wasm command/query parity
**Description:** Ensure the wasm adapter can exercise the same first-class flows covered by Rust integration tests.

**Acceptance criteria:**
- [ ] Generated package smoke tests cover at least one mutation and one layout query.
- [ ] Command names and payload examples match `@mai/mai-web-core` expectations.
- [ ] Boundary test still prevents direct app imports from `core/pkg`.

**Verification:**
- [ ] `core/tests/run_generated_package_smoke.sh`
- [ ] `cd web && pnpm run test:boundary`
- [ ] `cd web && pnpm run test`

**Dependencies:** Tasks 5, 6, 7

**Files likely touched:**
- `core/tests/generated_package_smoke.mjs`
- `core/src/adapters/wasm/**`
- `web/packages/mai-web-core/**`
- `web/packages/mai-wasm-adapter/**`

**Estimated scope:** Medium

### Task 9: Update contract documentation only where needed
**Description:** If the audit or implementation changes public behavior, update the relevant specs or adapter docs with concise notes.

**Acceptance criteria:**
- [ ] Spec changes describe behavior, not implementation trivia.
- [ ] Adapter docs show current command/query usage if payloads changed.
- [ ] Root README remains short and only links to deeper docs.

**Verification:**
- [ ] Documentation diff reviewed manually.

**Dependencies:** Tasks 1 through 8

**Files likely touched:**
- `docs/functional_spec.md`
- `docs/technical_spec.md`
- `docs/wasm_adapter_usage.md`
- `docs/adapter_payload_examples.md`
- `README.md`

**Estimated scope:** Small

## Final Checkpoint
- [ ] `./scripts/verify-local.sh`
- [ ] Root README still acts as the main repo entry point.
- [ ] Plan outcome summarized under `.agents/memory/`.
- [ ] Completed plan files removed from `.agents/plans/` after implementation is accepted.

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Existing wasm/web consumers rely on accidental behavior | Medium | Identify breaking changes during audit and prefer compatibility wrappers where reasonable. |
| Error normalization changes snapshots or tests broadly | Medium | Change one command/query path at a time and keep error variants stable. |
| Layout tests become over-specified | Medium | Assert semantic output and ordering, not internal helper details. |
| Scope drifts into persistence or UI work | High | Keep this plan limited to core contract, validation, layout, and adapter parity. |

## Open Questions
- Should any currently exported Rust APIs be treated as stable public API, or can they be adjusted before a first formal release?
- Should wasm JSON errors expose machine-readable error codes, human-readable messages, or both?
- Should cancellation and deletion remain separate public flows long term, or should one become a policy wrapper around the other?

## Commit Checkpoints
- `docs: add core engine contract plan`
- `test: cover rejected core command atomicity`
- `fix: normalize core validation errors`
- `test: cover booking lifecycle layout flows`
- `test: cover owner filtered weekly layout`
- `test: cover visible window layout clipping`
- `fix: align wasm adapter contract parity`
- `docs: update core contract notes`
