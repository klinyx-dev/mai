# Implementation Plan: Phase 5 Advanced Scheduling Capabilities

## Overview

Define and implement advanced scheduling features as explicit, versioned additions to `mai` without breaking fixed-slot consumers.

## Dependencies

- `docs/roadmap.md`
- `docs/product_quality_spec.md` (PQR-5 gate)
- `docs/advanced_scheduling_spec.md`
- Existing public API docs in `docs/adapter_payload_examples.md` and `docs/adapter_error_codes.md`

## Architecture Decisions

- Roll out in additive increments; keep current commands/queries intact.
- Favor new command/query variants over mutating existing payload contracts.
- Add tests for old and new invariants in parallel to protect backward compatibility.
- Treat recurrence as explicit template-driven slot generation, not implicit dynamic expansion in existing queries.

## Task List

### Phase 1: Contract and Spec Deltas

- [ ] Task 1: Update functional/technical specs for recurring templates, batch slot ops, capacity, blackout windows, metadata.
  - Acceptance: New invariants and rejection rules are explicit.
  - Verification: Spec sections are cross-linked and internally consistent.
  - Files likely touched: `docs/functional_spec.md`, `docs/technical_spec.md`, `docs/advanced_scheduling_spec.md`

- [ ] Task 2: Define compatibility and migration notes for existing consumers.
  - Acceptance: Unchanged vs new contracts are clearly documented.
  - Verification: Migration note template references all new payload families.
  - Files likely touched: `docs/release_process.md`, `docs/migration_guide_template.md`

### Phase 2: Envelope and Error Design

- [ ] Task 3: Add payload examples for new commands/queries.
  - Acceptance: Request/success/error examples exist for each new operation.
  - Verification: Examples match final TypeScript and serde contracts.
  - Files likely touched: `docs/adapter_payload_examples.md`

- [ ] Task 4: Extend error catalog for advanced capabilities.
  - Acceptance: New error codes have stable meaning and examples.
  - Verification: Contract tests cover serialized error mapping.
  - Files likely touched: `docs/adapter_error_codes.md`, `core/tests/serialization_contract.rs`

### Phase 3: Core and Adapter Implementation

- [ ] Task 5: Implement recurring template and batch slot command handling.
  - Acceptance: Deterministic generated slots and batch semantics.
  - Verification: `cargo test` covers deterministic outcomes and failure atomicity.
  - Files likely touched: `core/src/domain/*`, `core/src/application/*`, `core/tests/*`

- [ ] Task 6: Implement capacity, blackout filtering, and metadata validation.
  - Acceptance: Weekly layout/query results reflect new constraints without regressions.
  - Verification: Core invariants and layout tests pass for mixed old/new data.
  - Files likely touched: `core/src/domain/*`, `core/src/layout/*`, `core/tests/*`

### Phase 4: Web Contracts and UI Exposure

- [ ] Task 7: Add TypeScript contract exports and adapter mappings.
  - Acceptance: Public package exports include new DTOs and helpers only.
  - Verification: Boundary/export tests fail on leakage or removals.
  - Files likely touched: `web/packages/mai-web-core/*`, `web/packages/mai-wasm-adapter/*`, tests

- [ ] Task 8: Add Vue UI controls for advanced features (provider-facing only).
  - Acceptance: Booking flow remains constrained; provider/admin flow gets advanced controls.
  - Verification: Component and interaction tests for keyboard and pointer paths.
  - Files likely touched: `web/packages/mai-ui-vue/src/features/**/*`, tests

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Contract complexity causes semver instability | High | Keep old contracts immutable; add new variants with explicit docs. |
| Recurrence logic causes nondeterministic query output | High | Force deterministic ordering and seeded expansion rules in tests. |
| Advanced UI controls regress booking simplicity | Medium | Keep advanced controls provider-only and off in client flow. |

## Verification Summary

Before closing this phase:
- [ ] `cargo fmt --all --check`
- [ ] `cargo clippy --all-targets --all-features -- -D warnings`
- [ ] `cargo test`
- [ ] `cargo check --target wasm32-unknown-unknown -p mai`
- [ ] `cd web && pnpm run build && pnpm run test`
