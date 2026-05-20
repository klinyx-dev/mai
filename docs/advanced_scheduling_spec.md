# Spec: Phase 5 Advanced Scheduling Capabilities

## Status

Date: 2026-05-20  
Scope: approved for contract/spec work, not yet implemented in core/runtime packages.

## Objective

Expand `mai` beyond fixed single-slot booking with explicit, versioned capabilities while preserving deterministic behavior and backward compatibility for existing consumers.

## Guardrails

- Existing fixed-slot commands, queries, and error codes remain valid.
- Advanced capabilities are additive and feature-flagged at API surface where needed.
- No persistence/auth/payment ownership moves into core.
- Any new public envelope fields must be documented with compatibility notes.

## Capability Increments

1. Recurring availability templates (slot generation policy, not implicit runtime mutation).
2. Batch slot create/cancel operations with atomicity options.
3. Slot capacity greater than one (bounded integer capacity and deterministic seat allocation rule).
4. Blackout periods and holiday closures that suppress availability in query projections.
5. Appointment metadata extension fields (typed key/value map with validation limits).

## Non-Goals (This Phase)

- Waitlist lifecycle engine.
- Checkout/hold reservation timers.
- Multi-resource mandatory matching.

These are deferred to a follow-up phase after baseline advanced capabilities stabilize.

## Compatibility Policy (Phase 5)

- Additive command/query variants: minor version.
- New required fields in existing command/query payloads: major version.
- Error code additions in existing categories: minor version.
- Error code meaning changes or removals: major version.

## Required Design Outputs Before Code

1. Functional spec deltas in `docs/functional_spec.md`.
2. Technical spec deltas in `docs/technical_spec.md`.
3. Payload examples for each new command/query shape.
4. Error catalog additions with deterministic mapping examples.
5. Migration notes for v0.1 consumers.

## Acceptance Criteria

- Each increment above has explicit invariants and rejection semantics.
- Backward compatibility matrix lists unchanged vs. new contracts.
- A dedicated implementation plan exists under `.agents/plans/phase-5-advanced-scheduling-capabilities/`.
- No runtime behavior changes are merged before spec sign-off.
