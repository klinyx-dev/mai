# Core Contract Audit Notes

## Date
2026-05-19

## Scope reviewed
- `core/src/application/**`
- `core/src/state/**`
- `core/src/layout/**`
- `core/src/adapters/wasm/**`
- `core/tests/end_to_end_flows.rs`
- `core/tests/serialization_contract.rs`
- `docs/functional_spec.md` (FR-4 to FR-13)

## Findings
1. `slot_id` collisions were accepted and silently overwrote existing slots.
2. `appointment_id` collisions were accepted and silently overwrote existing appointments.
3. This behavior weakened deterministic command semantics for app/web adapters because repeated commands could mutate prior records instead of returning a rejection.

## Changes applied
1. Added deterministic business errors:
- `SlotIdAlreadyExists`
- `AppointmentIdAlreadyExists`

2. Enforced duplicate-id rejection in command handlers:
- `SchedulerService::add_slot`
- `SchedulerService::add_appointment`

3. Updated adapter error-code mapping:
- `slot_id_already_exists`
- `appointment_id_already_exists`

4. Updated tests:
- Replaced duplicate-replacement assertions with duplicate-rejection assertions.
- Added state-unchanged checks on duplicate rejection paths.
- Added wasm adapter contract test for duplicate slot-id error mapping.

## Verification completed
- `cargo test` (core): pass

## Remaining plan focus
- Continue with deeper contract-hardening checks for flow atomicity and layout query edge conditions that are not yet explicitly audited in this file.
