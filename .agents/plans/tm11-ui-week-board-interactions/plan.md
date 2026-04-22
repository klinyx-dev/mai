# Plan: TM11 UI Week Board Consistency and Interactions

## Objective
Evolve `@mai/mai-ui-vue` from a demo board into a reusable week-view UI library surface with:
- consistent visual system,
- full-day timeline by default (`00:00` to `24:00`),
- explicit interaction contracts for slots and appointments.

## Scope
- In scope:
  - week board UI structure/design consistency improvements,
  - timeline window API with full-day default,
  - interaction events and component API contracts,
  - docs and example app updates for real consumer usage.
- Out of scope:
  - moving rendering/header generation into Rust core,
  - drag-and-drop scheduling,
  - recurrence and advanced calendar features.

## Boundary Decision (Open Question Resolution for this milestone)
- Keep day/time header generation in TS/JS UI layer.
- Keep Rust core headless and semantic (`day_index`, `start_minute`, `end_minute`, `week_start`, `week_end`).

Rationale:
- aligns with technical spec headless principle,
- keeps locale/formatting/theming iteration in UI package,
- avoids coupling core to presentation rules.

## Phase 1: Define UI library contract extensions
- Add/define board props:
  - `visibleStartMinute?: number` (default `0`)
  - `visibleEndMinute?: number` (default `1440`)
  - `timeLabelFormat?: "24h" | "12h"` (default `24h`)
  - `emptyStateText?: string`
- Add interaction emits contract:
  - `slot-click`
  - `appointment-click`
  - `empty-cell-click`
  - `navigate-week` (retain current behavior)
- Add typed payload shapes for interaction events.

Acceptance criteria:
- Public API is explicit and backwards compatible.
- Existing consumers still compile without mandatory new props.

Commit checkpoint:
- `spec(ui): define TM11 week board interaction and timeline contract`

Status:
- Completed on 2026-04-22.

## Phase 2: Refactor board into reusable UI primitives
- Split `MaiBoard` into focused internal components/modules:
  - `MaiWeekHeader`
  - `MaiTimeGutter`
  - `MaiDayColumn`
  - `MaiEventCard`
- Keep exported API stable at `MaiBoard` initially.
- Normalize event mapping (`slot` vs `appointment`) into a shared view model.

Acceptance criteria:
- No behavior regression in rendered week view.
- Internal structure is simpler to maintain and extend.

Commit checkpoint:
- `refactor(ui): decompose MaiBoard into week-view primitives`

Status:
- Completed on 2026-04-22.

## Phase 3: Implement full-day timeline default + configurable window
- Replace fixed `08:00-20:00` constants with prop-driven window.
- Default to full-day (`0..1440`) rendering and labels.
- Keep deterministic clamping behavior for events outside window.
- Ensure hour grid and positioning math remain stable.

Acceptance criteria:
- Default board shows full-day gutter and grid.
- Custom windows render correctly and deterministically.

Commit checkpoint:
- `feat(ui): add full-day default timeline with configurable visible window`

Status:
- Completed on 2026-04-22.

## Phase 4: Implement interaction components and emits
- Add click targets and emit payloads:
  - slot card click emits slot metadata,
  - appointment card click emits appointment metadata,
  - empty cell click emits day index + minute anchor.
- Provide minimal accessibility semantics (`button` roles/keyboard support where appropriate).
- Keep interaction logic presentation-only (no domain mutation inside components).

Acceptance criteria:
- Consumers can hook user actions without custom DOM traversal.
- Interaction events are typed and documented.

Commit checkpoint:
- `feat(ui): expose slot and appointment interaction events`

## Phase 5: Design consistency pass
- Align spacing, typography scale, colors, states, and affordances for consistent board appearance.
- Add clear visual distinction between slots and appointments.
- Ensure desktop/mobile behavior remains usable without layout breakage.

Acceptance criteria:
- Board visual hierarchy is coherent and consistent.
- No hardcoded style drift across subcomponents.

Commit checkpoint:
- `style(ui): finalize consistent week board visual system`

## Phase 6: Tests, example integration, docs
- Add unit/component tests for:
  - timeline window defaults and overrides,
  - event positioning/clamping,
  - interaction emits payloads.
- Update example app to consume new UI interactions.
- Update docs:
  - `web/README.md`,
  - relevant technical spec section for UI library boundary.

Acceptance criteria:
- `pnpm run build` passes in `web/`.
- `pnpm run test` passes in `web/`.
- Example app compiles and demonstrates interaction hooks.

Commit checkpoint:
- `test(ui): cover timeline and interaction contracts`
- `docs(ui): publish TM11 week board usage and migration notes`

## Verification checklist
- `cd web && pnpm install`
- `cd web && pnpm run build`
- `cd web && pnpm run test`
- `cd web && pnpm --filter @mai/nuxt-app-example dev --host 127.0.0.1 --port 3000`

## Risks and mitigations
- Risk: API churn for early consumers.
  - Mitigation: additive props/events with sane defaults and migration notes.
- Risk: visual changes accidentally break event positioning.
  - Mitigation: add deterministic positioning tests before major style refactor.
- Risk: component split introduces complexity.
  - Mitigation: keep a stable `MaiBoard` facade and refactor internally first.
