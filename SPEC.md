# mai Technical Specification

## Purpose

`mai` is a frontend-first appointment scheduling toolkit for clinic, provider, service, resource, marketplace, and SaaS booking flows.

The project provides:

- A deterministic headless Rust scheduling core.
- A JSON-in/JSON-out wasm boundary.
- Framework-agnostic TypeScript contracts and client helpers.
- A browser wasm loader.
- Vue UI components for weekly scheduling, provider/admin actions, and client booking.
- A Nuxt example app.

`mai` does not own persistence, authentication, provider directories, product APIs, payments, notifications, reminders, deployment, or consuming-app workflows.

## Repository Shape

```text
mai/
  core/
    src/domain/        # Typed IDs, actors, slots, appointments, time, recurrence
    src/state/         # Canonical in-memory state
    src/commands/      # Command DTOs
    src/application/   # Service facade, policies, actor lookup, errors
    src/layout/        # Weekly projection, filtering, clipping, ordering
    src/adapters/wasm/ # JSON boundary and wasm-bindgen wrapper
  web/
    packages/mai-web-core/     # TypeScript contracts and client helpers
    packages/mai-wasm-adapter/ # Browser wasm loader
    packages/mai-ui-vue/       # Vue components, composables, styles
    examples/nuxt-app/         # Runnable integration example
```

Rust consumers should prefer the crate-root `MaiService` and `MaiError` facade names. The lower-level `application::scheduler_service` module is implementation vocabulary.

## Product Scope

In scope:

- Fixed-slot appointment booking.
- Slot create, batch create, reschedule, cancel, and delete.
- Appointment create, cancel, delete, and capacity-aware booking.
- Weekly layout projection with deterministic ordering.
- Owner, group, none, and all filters.
- Visible-hour windows and timezone-aware query anchoring.
- Blackout windows.
- Recurring availability templates and template application.
- Frontend booking flow and provider/admin availability management UI.

Out of scope:

- Core-owned persistence or database schema.
- Core-owned authentication or user records.
- Core-owned provider, clinic, resource, or location records.
- Payments, notifications, reminders, deployment, and app-specific backend APIs.
- General-purpose calendar event management unrelated to appointment booking.

## Domain Rules

- IDs are externally supplied and opaque.
- A slot has a time range, resource owner, creator, status, and optional capacity.
- Slot status is available, booked, or cancelled.
- Available slots are bookable.
- Cancelled slots are never bookable.
- Booked slots cannot be deleted or cancelled as availability.
- Appointment booking targets an existing slot and consumes capacity.
- Appointment cancellation is allowed for the slot resource owner, an invitee, or the appointment creator.
- Deleting or cancelling an appointment restores slot availability when capacity allows.
- Active overlapping slots for the same resource owner are rejected.
- Overlaps across different resource owners are allowed.
- Blackout windows block slot creation for affected owners and time ranges.
- Blackout IDs are unique per resource owner; the same blackout ID is allowed for different resource owners.
- Duplicate slot IDs and appointment IDs are rejected atomically.
- Invalid operations leave state unchanged.

## Public JSON Contract

Commands use a tagged envelope:

```json
{
  "command": "add_slot",
  "payload": {}
}
```

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

Queries use a tagged envelope:

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

Stable query names:

- `weekly_layout`

`view_filter` modes:

- `{ "mode": "all" }`: no owner filtering.
- `{ "mode": "none" }`: deterministic empty result.
- `{ "mode": "owners", "ids": ["owner-1"] }`: include listed resource owners.
- `{ "mode": "group", "ids": ["team-a"] }`: app-resolved grouping mode.

Successful mutation responses:

```json
{
  "status": "success",
  "data": "applied"
}
```

Error responses:

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
- `contract`: invalid JSON, unknown command/query, invalid timezone, or boundary payload problem.

Patch releases must not change existing error code semantics.

## Web Packages

### `@mai/mai-web-core`

Framework-agnostic contracts and JSON envelope helpers. Public contracts are available through `MaiCore.*`.

```ts
import { createMaiClient, type MaiCore } from "@mai/mai-web-core";

const payload: MaiCore.WeeklyLayoutQueryPayload = {
  anchor_date: "2026-05-07",
  view_filter: { mode: "owners", ids: ["owner-1"] },
};
```

### `@mai/mai-wasm-adapter`

Browser-side loader for generated wasm. App code should use this package instead of importing `core/pkg/*`.

```ts
import { createMaiClient } from "@mai/mai-web-core";
import { createWasmAdapter } from "@mai/mai-wasm-adapter";

const adapter = await createWasmAdapter();
const mai = createMaiClient(adapter);
```

### `@mai/mai-ui-vue`

Vue UI package. Public components are exported directly. Public type contracts are exposed through namespaces:

- `MaiBooking.*` for booking flow contracts.
- `MaiInteractive.*` for board interaction contracts.

```ts
import { MaiBookingFlow, type MaiBooking } from "@mai/mai-ui-vue";
import "@mai/mai-ui-vue/styles.css";

const state = ref<MaiBooking.State | null>(null);
const booking: MaiBooking.Config = { slotVisibility: "available-only" };
```

Primary components:

- `MaiBoard`: presentational weekly board.
- `MaiBoardInteractive`: provider/admin board with actions and command orchestration.
- `MaiBookingFlow`: client-facing booking flow.
- `MaiCalendarFilterToolbar`: owner/group filter UI.

Booking flow requirements:

- Consuming app supplies context, categories, optional locations, optional resources, availability metadata, and auth identity.
- Unauthenticated users may browse availability.
- Confirmation requires app-provided identity.
- The flow may query availability and book appointments.
- The flow must not create, edit, cancel, or delete provider availability.

Provider/admin requirements:

- Use `MaiBoardInteractive` for slot creation, rescheduling, cancellation, deletion, appointment cancellation/deletion, and blackout management.
- UI affordances may be hidden with visibility config.
- Permission checks remain the consuming app’s responsibility.
- Invalid mutations must preserve local UI/core state and surface deterministic errors.

## Boundary Rules

- App code must import documented package entrypoints only.
- App code must not import `core/pkg/*`, generated wasm files, package `src/*`, package `dist/*`, or feature-internal paths.
- `@mai/mai-web-core` is the stable framework-agnostic frontend contract surface.
- `@mai/mai-wasm-adapter` only loads wasm and constructs a `JsonAdapter`.
- `@mai/mai-ui-vue` is the Vue UI adapter over web-core contracts.
- The Rust core remains headless: no DOM, CSS, pixel math, browser APIs, Vue, Nuxt, or framework dependencies.

## UI Rules

The UI follows calm operational utility:

- Monochrome-first styling.
- Dense calendar information with spacious page framing.
- Accessible controls, visible focus states, screen-reader labels, and keyboard paths.
- Tokenized spacing, borders, colors, typography, and component states.
- No gradients, glassmorphism, noisy motion, or decorative feature-card treatment.

## Compatibility Policy

Patch-compatible:

- Additive optional payload fields.
- Additive exported helpers.
- Bug fixes preserving documented behavior.
- Additional examples for existing error codes.

Minor-compatible:

- New commands, queries, components, optional props, or optional events.
- New additive layout fields.
- Advanced capabilities that preserve existing contracts.

Breaking:

- Removing or renaming public exports.
- Changing JSON envelope shape.
- Changing required payload fields.
- Changing existing error semantics.
- Changing Vue prop/event names or payload shapes.
- Requiring a new runtime dependency from consumers without migration guidance.

Breaking releases require migration notes covering Rust, wasm JSON, TypeScript exports, Vue props/events, and examples.

## Build And Validation

Canonical validation:

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

Generated wasm package contract:

```bash
cd core
wasm-pack build --target web --out-dir pkg --out-name mai
```

Expected generated files:

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
