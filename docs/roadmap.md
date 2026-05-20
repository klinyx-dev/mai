# Roadmap: Product-Grade Open Source Appointment Scheduling

## Vision

`mai` should become a high-quality open source appointment scheduling toolkit for products that need booking flows, availability management, and calendar UI without outsourcing the core experience to a hosted scheduling platform.

The quality bar is comparable to mature calendar libraries such as FullCalendar and Calendar.js, while keeping `mai` focused on appointment booking:
- deterministic headless Rust core,
- stable wasm and TypeScript contracts,
- production-ready framework adapters,
- accessible, polished calendar UI components,
- clear extension points for real product integration.

## Product Positioning

`mai` is not trying to be a general-purpose calendar clone first. Its strongest path is to be a booking-first scheduling engine and UI kit that can power:
- clinic and healthcare appointment booking,
- service-provider booking pages,
- internal resource scheduling,
- marketplace/provider availability,
- SaaS products that need embedded appointment scheduling.

The core product promise:
- developers own their data and backend,
- the scheduling rules are deterministic and testable,
- UI packages provide a polished default experience,
- adapters make it easy to integrate into real apps.

## Roadmap Principles

1. Preserve the headless core boundary.
   Domain, state, validation, and layout must remain UI-independent.

2. Make every public contract boring and stable.
   Consumers should trust IDs, DTOs, error codes, ordering, and versioning.

3. Build booking workflows vertically.
   Each milestone should leave a real user flow usable end-to-end.

4. Prefer extension points over product assumptions.
   Authentication, persistence, payments, notifications, and provider directories usually belong to the consuming app.

5. Treat UI quality as product functionality.
   Accessibility, keyboard behavior, mobile usability, empty states, and visual hierarchy are required work, not polish afterthoughts.

## Current Baseline

As of the v0.1 line, the repository contains:
- Rust scheduling core with typed IDs, slots, appointments, validation, state transitions, and weekly layout.
- Wasm adapter with JSON command/query envelopes and deterministic error mapping.
- TypeScript web packages for core contracts, wasm adapter consumption, and Vue UI.
- Nuxt example app.
- Verification coverage for core invariants, wasm smoke tests, generated-package usage, and web package builds/tests.

This baseline is strong enough to move from "can schedule" to "can be adopted".

## Execution Specs and Plans

- Product quality spec: `docs/product_quality_spec.md`
- Phase 1 plan: `.agents/plans/phase-1-contract-hardening/plan.md`
- Phase 2 plan: `.agents/plans/phase-2-booking-flow-productization/plan.md`
- Phase 3 plan: `.agents/plans/phase-3-provider-availability-management/plan.md`
- Phase 4 plan: `.agents/plans/phase-4-calendar-ui-quality-parity/plan.md`

Phases 5-7 remain gated by `docs/product_quality_spec.md` requirements and should receive dedicated specs before implementation.

## Phases

### Phase 1: Contract Hardening and API Completeness

Goal: make the engine safe to depend on before expanding product scope.

Key outcomes:
- Versioned public API policy for Rust, wasm, and TypeScript packages.
- Stable compatibility rules for command/query DTOs and error codes.
- Complete generated TypeScript types and documentation for all public payloads.
- Golden tests for adapter payloads and errors.
- Clear deprecation process.

Candidate features:
- Public contract snapshots for JSON envelopes.
- Error catalog with examples for every category/code.
- Semver policy covering Rust crate, wasm package, and web packages.
- Public `mai` type import guidelines for app authors.
- Backward-compatibility test suite for example payloads.

Acceptance criteria:
- A consumer can upgrade patch versions without changing app code.
- Breaking changes are documented and intentionally versioned.
- Every public command/query has at least one copy-pasteable payload example.

### Phase 2: Booking Flow Productization

Goal: turn the existing clinic booking concept into a complete consumer-facing flow.

Key outcomes:
- Booking-page flow supports specialty/reason selection, optional provider selection, week browsing, unauthenticated preview, authenticated confirmation, and post-booking refresh.
- UI components expose controlled state hooks for consuming apps.
- Loading, empty, error, and success states are complete.
- Booking never allows client users to mutate provider availability.

Candidate features:
- `BookingFlow` Vue component with typed props/events.
- Specialty/reason selector contract.
- Optional provider selector contract.
- Confirm-booking step with external auth handoff.
- Availability requery after success.
- Configurable labels for healthcare, services, and generic appointments.

Acceptance criteria:
- The Nuxt example demonstrates a full public booking page.
- A consuming app can provide its own auth and backend calls.
- The client flow only calls availability query and appointment booking operations.

### Phase 3: Provider Availability Management

Goal: make availability creation and maintenance usable by resource owners/admins.

Key outcomes:
- Provider/admin week board supports creating, editing, moving, resizing, cancelling, and deleting slots.
- Interactions are keyboard-accessible and pointer-accessible.
- Validation errors surface in product-friendly language without hiding core error codes.
- Bulk workflows are designed without weakening the fixed-slot model.

Candidate features:
- Drag-to-create availability.
- Drag/resize rescheduling for existing slots.
- Inline slot editor.
- Provider filters and visible-hour controls.
- Conflict previews before commit.
- Bulk create from repeated time blocks.
- Cancelled slot visibility for admin/debug views.

Acceptance criteria:
- A provider can maintain a week of availability without editing raw payloads.
- Invalid operations leave UI and core state unchanged.
- Slot editing behavior is covered by unit, integration, and interaction tests.

### Phase 4: Calendar UI Quality Parity

Goal: make the UI package feel credible beside mature calendar libraries.

Key outcomes:
- Week view is polished on desktop, tablet, and mobile.
- Keyboard navigation is first-class.
- Accessibility is audited and documented.
- Dense and comfortable display modes exist.
- Layout handles overlaps, clipping, now indicator, visible-hour windows, and filtered resource owners predictably.

Candidate features:
- Roving focus across days, slots, and appointments.
- Screen-reader labels for time ranges and booking actions.
- Responsive mobile agenda/list mode.
- Sticky day headers and stable time axis.
- Current-time indicator.
- Empty-state and unavailable-state patterns.
- Theme tokens aligned with `DESIGN.md`.
- Interaction test suite with Playwright or an equivalent browser runner.

Acceptance criteria:
- The UI works without mouse-only assumptions.
- Text does not overflow core controls on supported viewport sizes.
- Visual states are distinguishable without relying only on color.
- Example app demonstrates realistic data density.

### Phase 5: Advanced Scheduling Capabilities

Goal: expand beyond fixed single slots while preserving deterministic contracts.

Key outcomes:
- New scheduling concepts are introduced behind explicit specs and versioned contracts.
- The fixed-slot model remains supported and simple.
- More complex appointment products can adopt `mai` without forking.

Candidate features:
- Recurring availability templates.
- Batch slot creation and cancellation.
- Multi-resource appointment requirements.
- Appointment capacity greater than one.
- Hold/reservation state for checkout-like flows.
- Appointment metadata extension fields.
- Blackout periods and holiday closures.
- Waitlist hooks.

Acceptance criteria:
- Each capability has a written functional and technical spec before implementation.
- Existing fixed-slot behavior remains backward-compatible.
- New invariants are covered by deterministic tests.

### Phase 6: Persistence and Backend Integration Guides

Goal: help real products store and synchronize scheduling data without making the core own infrastructure.

Key outcomes:
- Reference schemas and integration patterns exist for common stacks.
- Persistence remains an adapter/application concern outside the headless core.
- Sync and concurrency risks are clearly documented.

Candidate features:
- PostgreSQL reference schema.
- Event-sourced command log example.
- REST API example.
- Idempotency key guidance.
- Optimistic concurrency guidance.
- Multi-tenant data modeling guide.
- Backend validation checklist.

Acceptance criteria:
- A product team can wire `mai` to a backend without guessing table shape or command flow.
- Race conditions around booking are documented with recommended transaction boundaries.

### Phase 7: Ecosystem and Distribution

Goal: make `mai` easy to install, evaluate, and contribute to.

Key outcomes:
- Packages are published with clear names, versions, licenses, and examples.
- Documentation explains both quick start and advanced integration.
- The project has contribution standards comparable to serious open source libraries.

Candidate features:
- Published Rust crate.
- Published wasm/web packages.
- Hosted documentation site.
- Interactive examples and playground.
- Migration guides.
- Contributor guide and issue templates.
- Compatibility matrix for Rust, Node, pnpm, browsers, and frameworks.

Acceptance criteria:
- A new developer can run the example app in under 10 minutes.
- A production evaluator can find API stability, browser support, and release guidance quickly.
- CI validates the same commands documented for contributors.

## Competitive Quality Checklist

To be credible beside mature calendar libraries, `mai` needs:
- stable documented API surface,
- deterministic layout and ordering,
- strong TypeScript ergonomics,
- accessible keyboard interactions,
- polished responsive UI,
- framework examples,
- clear theming model,
- high-quality docs,
- predictable release process,
- broad test coverage for edge cases,
- migration and compatibility guidance.

## Near-Term Priority Order

1. Harden public contracts and documentation.
2. Finish the client-facing booking flow.
3. Finish provider availability management interactions.
4. Raise UI accessibility and responsive quality.
5. Publish packages and documentation.
6. Only then expand into recurrence, capacity, holds, and multi-resource scheduling.

## Open Product Questions

- Which framework adapter should be first-class after Vue: React, Web Components, or framework-agnostic DOM primitives?
- Should `mai` remain appointment-only, or eventually expose general event calendar concepts?
- Should recurrence be represented as generated slots only, or as first-class recurring rules?
- What is the minimum browser support target?
- What public package names should be reserved before the first serious release?
- Should payments and reminders remain documentation-only integration examples, or should official adapter hooks exist?

## Definition of Product-Grade

`mai` reaches product-grade quality when:
- a consuming app can build a complete public booking page,
- a provider can manage availability through polished UI,
- core contracts are stable enough for semver-based upgrades,
- tests protect scheduling invariants and adapter compatibility,
- documentation covers installation, integration, theming, errors, and releases,
- examples demonstrate realistic production workflows.
