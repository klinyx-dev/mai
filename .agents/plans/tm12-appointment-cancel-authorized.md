# Implementation Plan: TM12 Appointment Cancellation Authorization

## Overview
Add an explicit `cancel_appointment` command path with deterministic authorization rules.

## Scope
- In scope: command contract, authorization checks, error mapping, adapter/web contract updates, tests, specs.
- Out of scope: audit trail persistence for cancellation history, role/ACL subsystem.

## Tasks

### Task 1: Define cancellation command contract
- Extend `CancelAppointmentCommand` to include `cancelled_by`.
- Export command at public crate boundary.

Acceptance criteria:
- Command is serializable and consumable through existing mutation envelope.

### Task 2: Implement core authorization logic
- Implement `SchedulerService::cancel_appointment`.
- Allow cancellation when `cancelled_by` matches one of:
  - slot assignee
  - appointment invitee
  - appointment creator
- Reuse unbooking semantics (`appointment` removed, `slot` becomes `available`).

Acceptance criteria:
- Authorized cancellations succeed deterministically.
- Unauthorized cancellations fail with stable business error.

### Task 3: Add stable error + adapter mapping
- Add business error variant for unauthorized canceller.
- Map it to adapter-safe code in WASM error mapping.

Acceptance criteria:
- Unauthorized cancellation is surfaced as deterministic business envelope.

### Task 4: Tests and specs
- Add/adjust unit and serialization tests.
- Update functional/technical specs with cancellation rule.

Acceptance criteria:
- `cargo test`
- `cargo check --target wasm32-unknown-unknown -p mai`
