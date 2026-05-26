# Spec: Product-Grade Appointment Scheduling Toolkit

## Objective

Move `mai` from a working v0.1 scheduling engine into a product-grade open source appointment scheduling toolkit for real booking products.

The target user is a product developer who wants to embed appointment scheduling into an app while keeping ownership of auth, data, provider records, persistence, notifications, payments, and deployment.

Success means:
- a consumer can build a complete public booking page,
- a provider/admin can manage availability through polished UI,
- public contracts are stable and documented,
- the UI is accessible and responsive,
- package installation, examples, and release guidance are credible for open source adoption.

## Product Scope

### Always In Scope

- Headless Rust scheduling core.
- Wasm and TypeScript adapter contracts.
- Vue UI components and Nuxt example app.
- Appointment booking flows.
- Provider availability management.
- Semantic weekly layout output.
- Documentation, examples, contract tests, and release guidance.

### Explicitly Out of Scope for Near-Term Work

- Core-owned persistence.
- Core-owned authentication.
- Core-owned provider directory or clinic database.
- Core-owned payments, notifications, or reminders.
- General-purpose calendar event management unrelated to appointment booking.
- Recurrence, capacity, holds, waitlists, and multi-resource booking until separate specs are accepted.

## Tech Stack

- Rust core crate under `core/`.
- Wasm boundary built with `wasm-pack`.
- Web workspace under `web/` using pnpm.
- TypeScript packages:
  - `@mai/mai-web-core`
  - `@mai/mai-wasm-adapter`
  - `@mai/mai-ui-vue`
- Nuxt example under `web/examples/nuxt-app`.

## Commands

From repository root:

```bash
cargo fmt --all --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test
cargo check --target wasm32-unknown-unknown -p mai
```

Generated wasm package smoke:

```bash
cd core
wasm-pack build --target web --out-dir pkg --out-name mai
tests/run_generated_package_smoke.sh
```

Web package validation:

```bash
cd web
pnpm run build
pnpm run test
```

Full local validation when available:

```bash
./scripts/verify-local.sh
```

## Project Structure

- `core/src/domain`: domain entities, value objects, typed IDs, and local invariants.
- `core/src/application`: command/query facade, orchestration, policies, and typed errors.
- `core/src/state`: canonical in-memory schedule state.
- `core/src/layout`: semantic weekly layout projection.
- `core/src/adapters/wasm`: wasm JSON envelope boundary.
- `web/packages/mai-web-core`: TypeScript contracts and web client abstractions.
- `web/packages/mai-wasm-adapter`: wasm package consumption adapter.
- `web/packages/mai-ui-vue`: Vue UI components for board, booking, filters, and interactions.
- `web/examples/nuxt-app`: integration example.
- `docs`: public specs, roadmap, API docs, payload examples, release docs.
- `.agents/plans`: active implementation plans.
- `.agents/memory`: completed plan summaries.

## Code Style

Rust remains deterministic and explicit:

```rust
pub struct AddAppointmentCommand {
    pub appointment_id: AppointmentId,
    pub slot_id: SlotId,
    pub invitee_ids: Vec<ActorId>,
    pub title: String,
    pub created_by: ActorId,
}
```

TypeScript package APIs should expose stable, typed contracts and avoid leaking generated wasm internals:

```ts
export type BookingSubmitPayload = {
  slotId: string
  inviteeId: string
  inviteeDisplayName: string
  reasonId: string
}
```

UI components must be data-driven and accessible:
- use semantic buttons and form controls,
- keep keyboard behavior explicit,
- preserve visible focus states,
- align tokens with `DESIGN.md`,
- keep booking labels configurable where product language varies.

## Roadmap Requirements

### PQR-1: Public Contract Hardening

The project must define stable public contracts for:
- Rust command/query types that are intentionally public,
- wasm JSON envelopes,
- TypeScript package exports,
- UI component props, emits, and event payloads,
- error categories, codes, and messages.

Acceptance:
- every public command/query has an example payload,
- error codes are documented with examples,
- compatibility rules are documented,
- contract snapshots or equivalent tests protect JSON shape.

### PQR-2: Booking Flow Productization

The project must provide a complete client-facing booking flow:
- clinic/context is supplied by consuming app,
- user selects reason/specialty before slot selection,
- provider selection is optional and off by default,
- unauthenticated users can browse availability,
- confirmation requires consuming-app auth identity,
- booking creates exactly one appointment for exactly one existing slot,
- successful booking triggers availability refresh.

Acceptance:
- Nuxt example demonstrates the full flow,
- client-facing flow cannot create, edit, cancel, or delete slots,
- external auth handoff is documented,
- empty/loading/error/success states are implemented and tested.

### PQR-3: Provider Availability Management

The project must provide provider/admin UI for availability maintenance:
- create single slots,
- edit time ranges,
- drag/move and resize when enabled,
- cancel/delete available slots,
- expose validation errors without mutating local state after rejection,
- support owner filters and visible-hour windows.

Acceptance:
- provider can maintain a week of availability through UI,
- invalid operations are rejected atomically,
- pointer and keyboard paths are supported for core workflows,
- tests cover command payloads and interaction state.

### PQR-4: Calendar UI Quality Parity

The week board and booking UI must meet a mature calendar-library quality bar:
- responsive desktop/tablet/mobile layouts,
- keyboard navigation,
- screen-reader labels,
- stable text wrapping,
- deterministic visual ordering,
- distinguishable slot and appointment states,
- empty states and unavailable states,
- theme tokens aligned with `DESIGN.md`.

Acceptance:
- accessibility checks are documented,
- browser interaction tests cover representative flows,
- text does not overflow supported viewports,
- booking and provider examples use realistic data density.

### PQR-5: Advanced Scheduling Expansion Gate

Advanced scheduling features must not be added opportunistically.

Before implementing recurrence, capacity, holds, waitlists, blackout periods, multi-resource booking, or metadata extension fields:
- update functional spec,
- update technical spec,
- add migration and compatibility notes,
- define invariants and error behavior,
- add a dedicated plan under `.agents/plans`.

Acceptance:
- fixed-slot behavior remains backward-compatible,
- new behavior is guarded by explicit contracts,
- tests prove both old and new invariants.

### PQR-6: Frontend Adoption Guidance

The project must document how consuming frontend apps should adopt `mai` while keeping app services outside the toolkit.

Acceptance:
- package roles and supported import entrypoints are documented,
- framework-agnostic web-core usage is documented,
- Vue and Nuxt usage are documented,
- generated-wasm and package-internal imports are rejected in examples,
- auth, persistence, provider records, APIs, notifications, payments, and deployment are documented as consuming-app responsibilities.

### PQR-7: Ecosystem Readiness

The project must become easy to install, evaluate, and contribute to.

Acceptance:
- package publishing checklist exists,
- compatibility matrix exists,
- quick start works from clean checkout,
- contributor docs match CI,
- examples are documented and maintained.

## Testing Strategy

### Core

- Unit tests for value objects, status transitions, and validation.
- Application tests for command flows, rejection atomicity, duplicate IDs, and authorization.
- Layout tests for week boundaries, filtering, clipping, overlap grouping, and ordering.
- Serialization and wasm tests for envelope compatibility and error mapping.

### Web Packages

- Type tests or compile tests for exported contracts.
- Unit tests for adapter payload conversion.
- Component tests for booking and board state.
- Interaction tests for pointer and keyboard workflows.
- Boundary tests to prevent app code importing generated wasm directly.

### Docs and Examples

- Payload examples must be executable or validated by tests where practical.
- Example app must build in CI.
- Documented commands must match actual scripts.

## Boundaries

### Always

- Keep the core headless and deterministic.
- Use `pnpm` for web workspace commands.
- Update specs before implementing roadmap items.
- Preserve public error envelope shape unless a breaking version is planned.
- Run relevant Rust and web validation after implementation phases.

### Ask First

- Adding new runtime dependencies.
- Changing package names or publishing targets.
- Changing public JSON envelope shape.
- Introducing recurrence, capacity, holds, waitlists, or multi-resource booking.
- Dropping framework or browser support.

### Never

- Put DOM, CSS, pixel math, or framework concerns into Rust domain/layout modules.
- Let client-facing booking create or mutate provider availability.
- Treat generated wasm files as the app-facing API.
- Remove failing tests to ship a feature.
- Add advanced scheduling behavior without a dedicated spec.

## Success Criteria

This spec is satisfied when:
- Phase 1 and Phase 2 plans are implemented and validated,
- provider availability management has a reviewed implementation plan,
- UI quality work has explicit accessibility and responsive acceptance checks,
- advanced scheduling remains gated behind future specs,
- docs and examples are good enough for a new open source evaluator.

## Open Questions

- First-class adapter after Vue: React, Web Components, or framework-agnostic primitives?
- Recurrence model: generated slots or first-class recurrence rules?
- Should a future phase add React, Web Components, or framework-agnostic DOM primitives?
- Minimum browser support matrix?
- Package publishing names and release cadence?
