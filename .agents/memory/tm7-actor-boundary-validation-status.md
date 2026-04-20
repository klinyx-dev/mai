# TM7 Actor Boundary Validation Status

## Date
2026-04-20

## Scope
Track completion of TM7: optional actor lookup boundary and actor-reference validation in command flows.

## Completed Outcomes

1. Actor lookup collaborator boundary
- Added `ActorLookup` trait at application boundary (`core/src/application/actor_lookup.rs`).
- `SchedulerService` now supports optional collaborator wiring:
  - `with_actor_lookup(...)`
  - `from_state_with_actor_lookup(...)`
  - `set_actor_lookup(...)`

2. Optional actor-reference validation
- Added referential errors:
  - `AssigneeNotFound`
  - `CreatorNotFound`
- Added validation behavior:
  - `add_slot` checks `assignee_id` and `created_by` when lookup is configured.
  - `add_appointment` checks `created_by` when lookup is configured.
- Behavior remains unchanged when no lookup collaborator is configured.

3. WASM adapter compatibility
- JSON request/response envelope shape remains unchanged.
- Added deterministic referential error code mapping:
  - `assignee_not_found`
  - `creator_not_found`

4. Tests and docs
- Added scheduler-service tests for:
  - lookup-enabled rejection paths
  - lookup-disabled compatibility path
- Added serialization contract test for referential error code mapping.
- Updated adapter docs/examples with actor-reference referential error examples.

## Verification Snapshot
- `cargo fmt --all --check`: passed
- `cargo clippy --all-targets --all-features -- -D warnings`: passed
- `cargo test`: passed
- `cargo check --target wasm32-unknown-unknown -p mai`: passed
- `core/tests/run_generated_package_smoke.sh`: passed
