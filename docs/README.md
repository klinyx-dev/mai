# mai Project Documentation

## Current State

`mai` is a frontend-first appointment scheduling toolkit with a deterministic headless Rust core, a wasm JSON boundary, TypeScript web packages, Vue UI components, and a Nuxt example app.

The product is booking-first rather than a general-purpose calendar clone. It is meant for teams building clinic, provider, service, resource, marketplace, or SaaS appointment flows while keeping ownership of their own auth, data, persistence, provider records, APIs, notifications, payments, and deployment.

Current packages:

- Rust crate: `mai` under `core/`
- Web core: `@mai/mai-web-core`
- Wasm loader: `@mai/mai-wasm-adapter`
- Vue UI: `@mai/mai-ui-vue`
- Example app: `web/examples/nuxt-app`

## Repository Shape

- `core/src/domain`: typed IDs, actors, slots, appointments, time ranges, weeks, blackout windows, recurring templates, and enums.
- `core/src/state`: canonical in-memory `ScheduleState`.
- `core/src/commands`: command DTOs and mutation entrypoints.
- `core/src/application`: service facade, orchestration, authorization/lookup boundaries, policies, and typed errors.
- `core/src/layout`: deterministic weekly layout projection, filtering, clipping, overlap behavior, and visible-window support.
- `core/src/adapters/wasm`: JSON command/query boundary and wasm-bindgen wrapper.
- `web/packages/mai-web-core`: stable TypeScript contracts, envelope helpers, and `createMaiClient`.
- `web/packages/mai-wasm-adapter`: browser-side wasm loader returning a `JsonAdapter`.
- `web/packages/mai-ui-vue`: Vue board, interactive board, booking flow, composables, Nuxt helper, and styles.
- `.agents/plans`: active implementation plans only.
- `.agents/memory`: one synthetic state document for agents.

## Product Scope

In scope:

- Fixed-slot appointment booking.
- Slot creation, cancellation, deletion, rescheduling, and batch creation.
- Appointment creation, cancellation, deletion, and capacity-aware booking.
- Weekly layout projection with deterministic ordering.
- Resource-owner filters, group filters, explicit none filters, visible-hour windows, and timezone-aware query anchoring.
- Blackout windows.
- Recurring availability templates and template application.
- Frontend booking flow and provider/admin availability management UI.
- Public contract docs, compatibility rules, verification, and release guidance in this document.

Out of scope for `mai` ownership:

- Core-owned persistence.
- Core-owned authentication.
- Core-owned provider, clinic, resource, or location database.
- Core-owned payments, notifications, reminders, or deployment.
- App-specific backend APIs.
- General-purpose calendar event management unrelated to appointment booking.

## Core Domain Rules

- Slot IDs, appointment IDs, actor IDs, blackout IDs, and recurring template IDs are externally supplied and strongly typed in Rust.
- A slot has a time range, resource owner, creator, status, and optional capacity.
- A slot can be available, booked, or cancelled.
- Available slots are bookable; cancelled slots are never bookable; booked slots cannot be deleted or cancelled as availability.
- Appointment booking creates an appointment against an existing slot and marks or counts the slot as booked according to capacity.
- Appointment cancellation is allowed only for the slot resource owner, an invitee, or the appointment creator.
- Deleting or cancelling an appointment restores slot availability when capacity allows.
- Overlapping active slots for the same resource owner are rejected.
- Overlaps across different resource owners are allowed.
- Blackout windows block slot creation for affected owners and time ranges.
- Duplicate slot IDs and appointment IDs are rejected atomically.
- Invalid operations leave state unchanged.

## Public Commands

Stable command names:

- `add_slot`
- `add_slots_batch`
- `add_recurring_template`
- `apply_recurring_templates`
- `add_blackout_window`
- `reschedule_slot`
- `delete_slot`
- `cancel_slot`
- `add_appointment`
- `cancel_appointment`
- `delete_appointment`

Command envelopes use this JSON shape:

```json
{
  "command": "add_slot",
  "payload": {}
}
```

Successful mutation responses use:

```json
{
  "status": "success",
  "data": "applied"
}
```

## Public Query

Stable query name:

- `weekly_layout`

Query envelopes use this JSON shape:

```json
{
  "query": "weekly_layout",
  "payload": {
    "anchor_date": "2026-05-07",
    "timezone": "Europe/Paris",
    "view_filter": { "mode": "owners", "ids": ["owner-1"] },
    "visible_start_minute": 540,
    "visible_end_minute": 1020
  }
}
```

`view_filter` modes:

- `{ "mode": "all" }`: no owner filtering.
- `{ "mode": "none" }`: deterministic empty result.
- `{ "mode": "owners", "ids": ["owner-1"] }`: include listed resource owners.
- `{ "mode": "group", "ids": ["team-a"] }`: app-resolved owner group IDs at the frontend boundary.

Weekly layout response data contains:

- `week_start`
- `week_end`
- `slots`
- `appointments`
- optional `blackout_windows`

Slot, appointment, and blackout layout nodes include day index, start/end minute, and clipping flags. Weekly layout output is deterministic across equivalent insertion orders.

## Error Contract

Error responses use:

```json
{
  "status": "error",
  "error": {
    "category": "business",
    "code": "slot_already_booked",
    "message": "slot already booked"
  }
}
```

Error categories:

- `structural`: invalid data shape or invalid time/window invariants.
- `referential`: referenced entity does not exist.
- `business`: domain rule violation.
- `contract`: invalid JSON, unknown command/query, invalid timezone, or boundary-level payload problem.

Stable error codes include:

- `invalid_time_range`
- `invalid_week_range`
- `invalid_visible_window`
- `appointment_references_missing_slot`
- `appointment_count_exceeds_slot_capacity`
- `slot_not_found`
- `appointment_not_found`
- `actor_not_found`
- `duplicate_slot_id`
- `duplicate_appointment_id`
- `overlapping_slot`
- `slot_already_booked`
- `slot_not_booked`
- `slot_cancelled`
- `slot_unavailable`
- `slot_capacity_exceeded`
- `slot_capacity_invalid`
- `slot_has_appointments`
- `blank_appointment_title`
- `appointment_cancellation_forbidden`
- `invalid_json`
- `unknown_command`
- `unknown_query`
- `invalid_timezone`

Patch releases must not change existing error code semantics.

## Frontend Adoption

App code should import only documented package entrypoints:

```ts
import { createMaiClient } from "@mai/mai-web-core";
import { createWasmAdapter } from "@mai/mai-wasm-adapter";
import { MaiBookingFlow } from "@mai/mai-ui-vue";
import "@mai/mai-ui-vue/styles.css";
```

Do not import generated wasm files, `core/pkg/*`, package `src/*`, package `dist/*`, or feature-internal paths from an app.

Framework-agnostic use:

```ts
const adapter = await createWasmAdapter();
const mai = createMaiClient(adapter);

const layout = mai.queryWeeklyLayout({
  anchor_date: "2026-05-07",
  timezone: "Europe/Paris",
  view_filter: { mode: "owners", ids: ["owner-1"] },
});

const booked = mai.bookSlot({
  appointmentId: crypto.randomUUID(),
  slotId: "slot-1",
  inviteeId: "user-1",
  createdBy: "user-1",
  userDisplayName: "Alex Martin",
  reason: "Consultation",
});
```

Vue/Nuxt use:

- Use `MaiBookingFlow` for client-facing appointment booking.
- Use `MaiBoardInteractive` for provider/admin availability management.
- Use `createNuxtMaiState(adapter)` to provide adapter state in the Nuxt example.
- Import `@mai/mai-ui-vue/styles.css` once.

Booking flow requirements:

- The consuming app supplies context, categories/reasons, optional locations, optional providers/resources, availability metadata, and auth identity.
- Unauthenticated users may browse availability.
- Confirmation requires app-provided identity.
- Booking flow may query availability and book appointments; it must not create, edit, cancel, or delete provider availability.
- After successful booking, availability is refreshed.

Provider/admin requirements:

- Use `MaiBoardInteractive` with provider/admin mode for slot creation, rescheduling, cancellation, deletion, appointment cancellation/deletion, and blackout management.
- UI affordances can be hidden with visibility config, but permission checks remain the consuming app's responsibility.
- Invalid mutations must preserve local UI/core state and surface deterministic errors.

## UI and Design Rules

The UI follows the project design system in `DESIGN.md`:

- Monochrome-first, calm operational utility.
- Product UI is the visual content; avoid decorative graphics.
- Dense calendar information with spacious page framing.
- Accessible controls, visible focus states, screen-reader labels, and keyboard paths for core workflows.
- Avoid gradients, glassmorphism, saturated palettes, noisy motion, and decorative feature cards.
- Use tokenized spacing, borders, colors, typography, and component states.

## Compatibility Policy

The project uses semver expectations across Rust, wasm JSON, TypeScript packages, and Vue UI.

Patch-compatible changes:

- Additive optional payload fields.
- Additive exported helper functions.
- Bug fixes that preserve documented behavior.
- Additional error examples for existing codes.

Minor-compatible changes:

- New commands, queries, components, or optional props/events.
- New additive layout fields.
- New advanced capabilities that preserve existing contracts.

Breaking changes:

- Removing or renaming public exports.
- Changing JSON envelope shape.
- Changing required payload fields.
- Changing existing error code semantics.
- Changing Vue prop/event names or payload shapes.
- Requiring a new runtime dependency from consumers without migration guidance.

Breaking releases require migration notes covering Rust, wasm JSON, TypeScript exports, Vue props/events, and examples.

## Important Decisions

- Preserve a headless Rust core. Domain, state, validation, and layout must not depend on DOM, CSS, pixel math, Vue, Nuxt, or browser APIs.
- Keep IDs externally supplied. The core does not own ID generation.
- Treat actor IDs as opaque references unless an optional actor lookup is configured at the application boundary.
- Keep cancelled slots in state for audit/debug behavior; do not automatically purge them in core.
- Keep the wasm boundary JSON-in/JSON-out. JavaScript consumers should not rely on Rust internal DTO paths.
- Make `@mai/mai-web-core` the stable framework-agnostic frontend contract surface.
- Keep `@mai/mai-wasm-adapter` limited to wasm loading and `JsonAdapter` construction.
- Keep `@mai/mai-ui-vue` as the Vue UI adapter built on web-core contracts.
- Keep `mai` frontend-only for adoption. Auth, persistence, provider directories, APIs, payments, notifications, reminders, and deployment are consuming-app responsibilities.
- Treat advanced scheduling capabilities as gated contract work. Recurrence, capacity, batch operations, blackout windows, and related features must remain backward-compatible with fixed-slot behavior.
- Keep completed agent plans out of `.agents/plans`; summarize completed work in `.agents/memory`.

## Roadmap Status

Completed:

- Core fixed-slot scheduling engine.
- Wasm adapter and wasm-bindgen wrapper.
- TypeScript web-core contracts and client helpers.
- Wasm runtime adapter package.
- Vue UI package with week board, interactive board, booking flow, filters, action cards, and styles.
- Nuxt example app.
- Public contract hardening and compatibility documentation.
- Booking flow productization.
- Provider availability management.
- Calendar UI accessibility/responsive quality pass.
- Advanced scheduling increments currently present: recurring templates, batch slot creation, capacity, and blackout windows.
- Frontend adoption structure and package boundary hardening.

Next logical product work:

- Ecosystem readiness: package publishing checklist, clean install path, hosted docs/site decision, examples, contribution standards, and release automation.
- Optional future adapter decision: React, Web Components, or framework-agnostic DOM primitives.
- Continued UI manual review for dense real-world data and touch ergonomics.

## Verification

Canonical full local validation from repository root:

```bash
./scripts/verify-local.sh
```

Manual equivalent:

```bash
cargo fmt --all --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test
cargo check --target wasm32-unknown-unknown -p mai
core/tests/run_generated_package_smoke.sh
cd web && pnpm run build && pnpm run test
```

Generated wasm package build contract:

```bash
cd core
wasm-pack build --target web --out-dir pkg --out-name mai
```

Expected generated package files:

- `core/pkg/mai.js`
- `core/pkg/mai_bg.wasm`
- `core/pkg/mai.d.ts`
- `core/pkg/package.json`

Web validation:

```bash
cd web
pnpm run build
pnpm run test
pnpm run test:boundary
pnpm run test:ui-smoke
```

Boundary validation rejects direct generated-wasm imports and package-internal app imports.

## Tooling Baseline

- Rust stable.
- Rust target `wasm32-unknown-unknown`.
- `wasm-pack`.
- Node.js `22.x`.
- `pnpm` `10.x`.
- Vue peer dependency `^3.5.0`.

## Release Process

- `main` is the stable release branch.
- Release PRs must merge into `main` before tagging.
- Version tags use semantic version format, for example `v0.1.2`.
- Tags must be created from commits already on `main`.
- Pre-release validation is `./scripts/verify-local.sh`.
- `CHANGELOG.md` must include the release entry.
- Breaking releases require migration notes.
- Bad tags are not reused; ship a follow-up patch release instead.

## Agent Workflow

- Read `AGENTS.md`, `.agents/rules/*.md`, and relevant skills before code or docs changes.
- For new feature work, create an active plan under `.agents/plans/<feature-name>/`.
- Implement in small verifiable phases.
- Run relevant tests after meaningful changes.
- Summarize completed outcomes into `.agents/memory/project-state.md`.
- Remove completed active plan files from `.agents/plans`.
