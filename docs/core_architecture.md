# Core Engine Architecture

## Goal

This document defines the intended architecture boundaries for the Rust core engine.
The core must remain headless, deterministic, and adapter-friendly while keeping
domain and business logic isolated from transport and platform concerns.

## Layers

1. `domain`
- Owns entities/value objects (`Slot`, `Appointment`, `TimeRange`, `WeekRange`, typed IDs).
- Owns local invariants and transition rules that do not require repository traversal.
- Must not depend on `application`, `adapters`, or platform crates.

2. `application`
- Owns command/query orchestration (`SchedulerService`).
- Coordinates state reads/writes, actor/reference checks, and business policies.
- Maps domain/validation failures into stable application errors.

3. `state`
- Owns canonical in-memory schedule storage model.
- Exposes controlled read/write methods for application/layout/validation modules.
- Avoids exposing unconstrained mutable maps as the primary public API.

4. `layout`
- Owns semantic projection queries and weekly layout computation.
- Consumes domain/state/query inputs and produces deterministic projection DTOs.
- Must not depend on `adapters`.

5. `adapters`
- Owns wire contracts, serde envelopes, and platform boundaries (`wasm`).
- Converts wire DTOs to/from core command/query types.
- Can depend on `application` and `layout`, never the reverse.

## Dependency Rules

- Allowed inward dependency direction:
  - `adapters -> application -> domain/state/layout`
- Forbidden:
  - `domain -> adapters`
  - `layout -> adapters`
  - `domain -> application`

## Public API Policy

Stable public API should prioritize:
- command/query contracts
- scheduler service entrypoints
- deterministic error enums
- semantic layout DTOs

Internal modules should remain internal by default and only be exported when they
are intentional extension points.
