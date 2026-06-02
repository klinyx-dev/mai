# mai Project State

## Snapshot

Date: 2026-06-02

`mai` is a frontend-first appointment scheduling toolkit. The repository contains a deterministic Rust core, wasm JSON adapter, TypeScript web contracts, a wasm loader package, Vue UI components, and a Nuxt example app.

Current emphasis:

- Keep the core headless and deterministic.
- Keep the app-facing integration frontend-only.
- Make package entrypoints and contracts stable for teams adopting the product.
- Keep auth, persistence, provider records, APIs, payments, notifications, reminders, and deployment outside `mai`.

## Current Architecture

- Rust crate `mai` under `core/`, version `0.1.0`, crate types `cdylib` and `rlib`.
- Core modules: `domain`, `state`, `commands`, `validation`, `layout`, `application`, `adapters`.
- Wasm boundary exposes `WasmBindgenAdapter::new`, `execute_command_json`, and `execute_query_json`.
- Web workspace packages:
  - `@mai/mai-web-core`: TypeScript contracts, envelope helpers, `createMaiClient`.
  - `@mai/mai-wasm-adapter`: wasm loader returning `JsonAdapter`.
  - `@mai/mai-ui-vue`: Vue board, interactive board, booking flow, filters, action cards, composables, Nuxt helper, styles.
- Example app: `web/examples/nuxt-app`.

## Implemented Product Capabilities

- Fixed-slot scheduling with typed IDs.
- Slot add, batch add, reschedule, cancel, and delete.
- Appointment add, cancel, and delete.
- Capacity-aware appointment booking.
- Recurring availability templates and template application.
- Blackout windows.
- Actor lookup boundary and cancellation authorization.
- Weekly layout projection with deterministic ordering.
- Owner/group/none/all filters.
- Timezone-aware weekly query anchoring.
- Visible-hour window clipping/filtering.
- Wasm JSON command/query envelopes and deterministic error mapping.
- TypeScript public contracts and client helpers.
- Vue presentational board, interactive provider/admin board, and client-facing booking flow.
- Nuxt example app.
- Boundary checks preventing app direct imports from generated wasm and package internals.
- Compact public type namespaces for frontend consumers: `MaiCore.*`, `MaiBooking.*`, and `MaiInteractive.*`.

## Important Decisions

- The Rust core remains headless: no DOM, CSS, pixel math, browser APIs, Vue, or Nuxt dependencies.
- IDs are externally supplied; the core does not generate IDs.
- Actor IDs are opaque unless optional actor lookup validation is configured.
- Cancelled slots remain in state for audit/debug behavior.
- Wasm remains JSON-in/JSON-out; generated wasm internals are not the app-facing API.
- `@mai/mai-web-core` is the stable framework-agnostic frontend contract surface.
- `@mai/mai-wasm-adapter` only loads wasm and constructs a `JsonAdapter`.
- `@mai/mai-ui-vue` is the Vue UI adapter over web-core contracts.
- `mai` does not own backend APIs, persistence, auth, provider directories, payments, notifications, reminders, or deployment.
- Completed implementation plans are removed from `.agents/plans` and summarized here.
- Public contract changes follow semver expectations; breaking changes require migration notes.
- Frontend apps should prefer namespace type imports over individual root type imports.

## Public Contract Baseline

Commands:

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

Query:

- `weekly_layout`

Response envelope:

- Success: `{ "status": "success", "data": ... }`
- Error: `{ "status": "error", "error": { "category": "...", "code": "...", "message": "..." } }`

Error categories:

- `structural`
- `referential`
- `business`
- `contract`

Weekly layout payload supports:

- `anchor_date`
- optional `timezone`
- optional `view_filter`
- optional `visible_start_minute`
- optional `visible_end_minute`

`view_filter` modes:

- `all`
- `none`
- `owners`
- `group`

## UI and Frontend State

- `MaiBoard` is the presentational week board.
- `MaiBoardInteractive` handles provider/admin interactions and command orchestration.
- `MaiBookingFlow` handles client-facing booking.
- `@mai/mai-ui-vue` root exports component values directly and exposes public contracts through `MaiBooking.*` and `MaiInteractive.*`.
- `@mai/mai-web-core` exposes framework-agnostic contracts through `MaiCore.*`.
- Rust consumers should prefer crate-root `MaiService` and `MaiError` facade names.
- Booking flow must not mutate provider availability.
- Provider/admin board handles slot and appointment administration actions according to app-provided permissions.
- Styles follow `DESIGN.md`: monochrome-first, calm operational utility, tokenized CSS, restrained status colors, accessible focus states, no decorative gradients/glassmorphism.
- Manual visual review for dense data and touch ergonomics remains a useful future check.

## Documentation State

- `README.md` is the single concise project entrypoint.
- `SPEC.md` is the single technical source of truth.
- Package-level READMEs, `README-dev.md`, and `docs/README.md` were removed to avoid fragmented documentation.
- `.agents/memory/project-state.md` remains the single synthetic agent memory document.

## Verification Baseline

Canonical command:

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

Last known full validation passed on 2026-06-02 with `./scripts/verify-local.sh`.

Consumer validation also passed on 2026-06-02:

```bash
pnpm -C klinyx-web test
pnpm -C klinyx-web typecheck
pnpm -C klinyx-web build
pnpm -C clinic test
pnpm -C clinic typecheck
pnpm -C clinic build
```

## Next Logical Work

- Ecosystem readiness: package publishing checklist, clean consumer install path, docs/site decision, examples, contribution standards, and release automation.
- Decide whether the next UI adapter should be React, Web Components, or framework-agnostic DOM primitives.
- Continue hardening package boundaries and public API tests when exports change.
