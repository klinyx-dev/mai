# Implementation Plan: TM14 Interactive Board Wrapper (UI Library)

## Overview
Move week-board interaction orchestration from app code into `@mai/mai-ui-vue` by introducing an interactive wrapper component that provides built-in slot/appointment/create flows.

## Why this is the next logical step
- Current example app still owns substantial interaction state and popover wiring.
- Consumers should get a production-usable board with minimal setup.
- This increases package ergonomics without changing core Rust behavior.

## Scope
- In scope: interactive wrapper API contract, library-side orchestration state, popover rendering/positioning, typed event surface, tests/docs, example app migration.
- Out of scope: drag-and-drop, recurrence UX, role-based permission UI, visual redesign of all components.

## Tasks

### Task 1: Define interactive wrapper contract
- Add spec-level contract for `MaiBoardInteractive` in technical docs.
- Define props:
  - `layout`, `anchorDate`, `isLoading`, `errorMessage`
  - mutation handlers or adapter-bound action callbacks
  - defaults for `assigneeId`, `createdBy`, and create-slot duration
- Define emitted events:
  - `slot-created`
  - `slot-booked`
  - `slot-cancelled`
  - `slot-deleted`
  - `appointment-cancelled`
  - `appointment-deleted`
  - `interaction-error`

Acceptance criteria:
- Contract is explicit and migration-safe.
- Existing presentational `MaiBoard` remains unchanged.

### Task 2: Implement `MaiBoardInteractive` in `@mai/mai-ui-vue`
- Add a new wrapper component that composes:
  - `MaiBoard`
  - `MaiCreateSlotCard`
  - `MaiSlotActionsCard`
  - `MaiAppointmentActionsCard`
- Internalize state:
  - selected slot
  - selected appointment
  - pending slot draft
  - busy/error feedback
- Internalize popover positioning and close behavior.

Acceptance criteria:
- A consumer can render one component and get full interactive flow.
- Existing card components remain reusable stand-alone.

### Task 3: Add adapter-integrated action mode (optional hook path)
- Provide a simple integration path that accepts a mutation executor (for `useMai` or compatible API).
- Ensure command dispatch uses `COMMANDS + createCommandEnvelope` from `@mai/mai-web-core`.

Acceptance criteria:
- No raw command string literals in the wrapper mutation path.
- Wrapper supports both controlled callbacks and adapter-driven mode.

### Task 4: Tests for interaction orchestration
- Add tests for:
  - empty cell click opens create-slot popover
  - slot click opens slot actions
  - appointment click opens appointment actions
  - successful actions clear local selection and emit expected event
  - failed actions emit `interaction-error` deterministically

Acceptance criteria:
- `pnpm --filter @mai/mai-ui-vue build`
- `pnpm --filter @mai/mai-ui-vue test`

### Task 5: Migrate Nuxt example to thin consumer
- Replace page-level orchestration logic with `MaiBoardInteractive`.
- Keep example focused on data bootstrapping + top-level navigation.

Acceptance criteria:
- `examples/nuxt-app/pages/index.vue` becomes significantly smaller.
- Runtime behavior remains equivalent (create/book/cancel/delete flows).

### Task 6: Final docs + workflow artifacts
- Update `web/README.md` with recommended usage for `MaiBoardInteractive`.
- Update `docs/technical_spec.md` web boundary section with interactive wrapper guidance.
- Add memory note under `.agents/memory/`.
- Remove completed plan file from `.agents/plans/`.

Acceptance criteria:
- `pnpm run test` in `web/` passes.
- Documentation reflects the new recommended integration path.

## Commit checkpoints
1. `spec(ui): define MaiBoardInteractive contract and event model`
2. `feat(ui): add MaiBoardInteractive orchestration wrapper`
3. `feat(ui): add typed command-driven mutation integration path`
4. `test(ui): cover interactive wrapper flows and error emission`
5. `refactor(example): migrate nuxt app to thin interactive board consumer`
6. `docs(ui): document interactive board usage and finalize TM14 artifacts`
