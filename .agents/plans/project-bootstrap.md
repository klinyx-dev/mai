# Implementation Plan: Project Bootstrap

## Overview
Build the first working version of the Rust scheduling core described in `docs/functional_spec.md` and `docs/technical_spec.md`. The goal is a headless crate with deterministic domain logic, command handling, validation, and weekly semantic layout output, ready for a later WASM adapter.

## Architecture Decisions
- Rust crate first; no TypeScript core.
- Keep the core headless: no UI, DOM, CSS, or pixel logic.
- Accept IDs from callers; do not generate them in Phase 1.
- Use in-memory state first, with a narrow service API and typed errors.

## Phase 1: Repository Foundation

### Task 1: Scaffold the Rust workspace
- Create the crate structure from the technical spec: `domain`, `commands`, `validation`, `state`, `layout`, `application`, `adapters`, `lib.rs`.
- Add baseline dependencies: `chrono`, `serde`, `thiserror`, and test dependencies as needed.
- Add `cargo fmt`, Clippy, and test commands to `README.md`.

Acceptance criteria:
- `cargo build` succeeds.
- Module tree matches the planned architecture.

Verification:
- Run `cargo build`
- Run `cargo fmt --all --check`

### Task 2: Define the foundational domain types
- Implement typed IDs, `ActorRef`, `TimeRange`, `SlotStatus`, `Slot`, `Appointment`, and `WeekRange`.
- Centralize invariant-friendly constructors for types that require validation.

Acceptance criteria:
- Core model types compile and serialize.
- Invalid time ranges are rejected.

Verification:
- Run `cargo test domain`

Commit checkpoint:
- `chore: scaffold scheduler core`

## Phase 2: State and Command Flows

### Task 3: Implement canonical state and command DTOs
- Add `ScheduleState` and all Phase 1 command structs.
- Create typed error enums for structural, referential, and business rule failures.

### Task 4: Implement `SchedulerService` mutations
- Add `add_slot`, `delete_slot`, `cancel_slot`, `add_appointment`, and `delete_appointment`.
- Enforce atomic booking and unbooking transitions in one orchestration layer.

Acceptance criteria:
- Booked slots cannot be deleted.
- Booking creates exactly one appointment and marks the slot `Booked`.
- Deleting an appointment restores slot availability.

Verification:
- Run `cargo test application`

Commit checkpoint:
- `feat: implement schedule state and command handlers`

## Phase 3: Validation and Layout

### Task 5: Centralize validation rules
- Implement overlap checks, slot-status checks, and slot-to-appointment invariants.
- Keep rule evaluation deterministic and side-effect free.

### Task 6: Build the weekly layout engine
- Implement `WeeklyLayoutQuery`, layout nodes, week filtering, minute offsets, clipping flags, and deterministic sorting.
- Exclude booked and cancelled slots from slot-node output while still including appointments.

Acceptance criteria:
- Same input state and query always produce the same ordered layout output.
- Layout returns semantic values only.

Verification:
- Run `cargo test validation`
- Run `cargo test layout`

Commit checkpoint:
- `feat: add validation and weekly layout engine`

## Phase 4: Adapter Readiness and Project Hygiene

### Task 7: Stabilize public DTOs and serialization
- Audit public structs for serde support and stable API boundaries.
- Add adapter-facing examples for command and query payloads.

### Task 8: Strengthen tests and docs
- Add integration tests for end-to-end command sequences.
- Update `README.md` with quick start, commands, and architecture summary.
- Record any architectural changes as ADRs in `docs/` if implementation diverges from the specs.

Acceptance criteria:
- Core flows have unit and integration coverage.
- README explains how to build, test, and extend the crate.

Verification:
- Run `cargo test`
- Run `cargo clippy --all-targets --all-features -D warnings`

Commit checkpoint:
- `docs: finalize bootstrap documentation and test coverage`

## Risks and Mitigations
- Time handling drift: keep UTC internally and defer timezone conversion to adapters.
- Validation sprawl: keep checks centralized under `validation/` and return typed errors only.
- Early API churn: keep the public service boundary small until the first consumer exists.

## Open Questions
- Should actor existence checks remain out of scope for Phase 1, as currently recommended?
- Do we want a Cargo workspace from day one, or a single crate until the WASM adapter exists?
- Should snapshot tests be added immediately for layout output, or after the DTOs stabilize?
