# Implementation Plan: TM7 Actor Boundary and Validation Collaborator

## Overview
Introduce an application-layer actor lookup boundary so Phase 1 commands can optionally validate `assignee_id` and `created_by` references without coupling the core to persistence or external services.

## Scope
- In scope: collaborator trait design, scheduler-service wiring, deterministic actor-reference errors, adapter error-code mapping, and docs/tests.
- Out of scope: persistence layer implementation, identity provider integration, authorization/permissions.

## Tasks

### Task 1: Define actor lookup boundary
- Add a narrow trait for actor existence checks in the application boundary.
- Keep collaborator optional so existing behavior remains valid when no actor source is provided.

Acceptance criteria:
- Trait contract is stable and minimal.
- Core domain/layout modules remain dependency-free from actor storage concerns.

### Task 2: Add optional actor-reference validation
- Validate assignee/creator references via collaborator in:
  - slot creation flows
  - appointment creation flows
- Preserve current behavior when collaborator is absent.

Acceptance criteria:
- Missing actor references yield deterministic scheduler errors when collaborator is configured.
- Existing command behavior remains unchanged when collaborator is not configured.

### Task 3: Preserve adapter contract and error determinism
- Map actor-reference validation failures to stable adapter error codes/messages.
- Keep request/response JSON envelope shape unchanged.

Acceptance criteria:
- No envelope schema drift.
- New actor-reference failure codes are documented and tested.

### Task 4: Test and document TM7
- Add service-level tests for collaborator-enabled and collaborator-disabled behavior.
- Extend serialization/adapter tests for new actor-reference errors.
- Update usage docs with collaborator semantics and defaults.

Verification:
- `cargo fmt --all --check`
- `cargo clippy --all-targets --all-features -- -D warnings`
- `cargo test`
- `cargo check --target wasm32-unknown-unknown -p mai`
- `core/tests/run_generated_package_smoke.sh`

## Commit Checkpoints
1. `feat: add actor lookup collaborator boundary`
2. `feat: validate actor references when collaborator is configured`
3. `test: cover actor reference validation with and without collaborator`
4. `docs: document TM7 actor boundary defaults and error codes`
