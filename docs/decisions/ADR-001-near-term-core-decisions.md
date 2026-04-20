# ADR-001: Lock Near-Term Core Decisions for v0.1.0

## Status
Accepted

## Date
2026-04-20

## Context
After completing TM1-TM6c, the project reached a usable Rust + WASM baseline but still carried "open technical decisions" in the technical spec. Leaving these open risks churn in API contracts, validation expectations, and consumer docs during release hardening.

The team needs a stable decision baseline for `v0.1.0`.

## Decision
Lock the following near-term decisions:

1. Slot status naming is fixed to `Available | Booked | Cancelled`.
2. IDs are generated outside the core and passed into commands/DTOs.
3. Actor existence validation is deferred; actor IDs are treated as opaque references in Phase 1.
4. Cancelled slots are retained in core state and excluded from availability/layout views.

## Alternatives Considered

### Keep decisions open until post-release
- Pros: flexibility for future redesign.
- Cons: unstable contract expectations and repeated re-discussion during implementation.
- Rejected: too risky for release stabilization.

### Add core-owned ID generation now
- Pros: convenient for some callers.
- Cons: introduces side effects and additional policy surface in core.
- Rejected: conflicts with deterministic, headless core focus.

### Add actor repository validation now
- Pros: stronger referential guarantees in core.
- Cons: introduces persistence/dependency boundary decisions not needed for Phase 1.
- Rejected: deferred to later milestone when actor-source boundary is explicit.

### Purge cancelled slots automatically in core
- Pros: smaller in-memory state footprint.
- Cons: loses historical lifecycle context and complicates deterministic behavior.
- Rejected: archival policy belongs to higher layers.

## Consequences
- Near-term behavior and docs are stable for `v0.1.0`.
- Core remains deterministic and platform-agnostic.
- Future changes to these decisions must be introduced via new ADRs and versioned compatibility notes.
