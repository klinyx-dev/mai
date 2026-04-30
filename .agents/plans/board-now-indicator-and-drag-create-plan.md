# Implementation Plan: Board Now Indicator and Drag-to-Create Slot

## Overview
Improve the weekly board UI with two scheduling interactions:

- A reusable current-time indicator: a red horizontal line rendered in any time-column view when the rendered date is today and the current time is inside the visible time window. The first consumer is the week board, but the implementation must also fit a future day view.
- A blank-space drag gesture: pointer down on an empty day grid area, drag vertically, and release to open the existing create-slot overlay with the dragged time range.

This work stays inside `web/packages/mai-ui-vue`. The scheduling core and command payloads do not change.

## Architecture Decisions
- Keep time-to-position calculations in reusable board/model helpers, not embedded ad hoc in JSX.
- Treat the now indicator as presentation state derived from a rendered date, current time, and visible window. Week-specific day index lookup should be a thin wrapper over the reusable date/time calculation.
- Build the now-indicator UI as a reusable component or helper that can be mounted by week day columns now and by a future day view later.
- Reuse the existing `previewSlotDraft` and `empty-cell-click` flow for drag-to-create so `MaiBoardInteractive` can keep using the current create-slot card.
- Keep drag-to-create scoped to blank grid space only. Dragging existing slot cards remains owned by `MaiEventCard`.
- Use pointer events for drag-to-create to match the recently hardened slot move/resize interactions.
- Keep the UI aligned with `DESIGN.md`: precise, restrained, no decorative motion, no gradients.

## Task List

### Phase 1: Shared Time/Position Foundation

## Task 1: Add Reusable Current-Time View Model Helpers

**Description:** Add deterministic helpers that compute whether a rendered date is today and where the now line should sit inside a visible time grid. Add a small week-view wrapper only for resolving the current day index in a displayed week.

**Acceptance criteria:**
- [ ] Generic helper accepts a rendered ISO date, visible start/end minutes, and injected `Date`.
- [ ] Generic helper returns `null` when rendered date is not today.
- [ ] Generic helper returns `null` when current minute is outside `visibleStartMinute..visibleEndMinute`.
- [ ] Generic helper returns `{ minuteOfDay, topPercent }` when current time is visible.
- [ ] Week-specific helper wraps the generic helper and adds `dayIndex` only for week board consumers.
- [ ] Helpers are testable with injected `Date`, not hardwired to real time.

**Verification:**
- [ ] Add unit tests in `web/packages/mai-ui-vue/tests/board.test.mjs` or a dedicated test file.
- [ ] Run `pnpm --filter @mai/mai-ui-vue build`.
- [ ] Run `pnpm --filter @mai/mai-ui-vue test`.

**Dependencies:** None

**Files likely touched:**
- `web/packages/mai-ui-vue/src/board/model/now-indicator.ts` or `web/packages/mai-ui-vue/src/board/model/view-model.ts`
- `web/packages/mai-ui-vue/tests/board.test.mjs`

**Estimated scope:** Small

Commit checkpoint: `add: compute reusable now indicator position`

## Task 2: Add Drag-to-Create Draft Model Helpers

**Description:** Add deterministic helpers for converting a blank-grid pointer drag into a normalized slot draft range.

**Acceptance criteria:**
- [ ] Pointer down and current pointer position convert to start/end minutes.
- [ ] Range snaps to the board's existing 15-minute gesture precision if consistent with current interactions.
- [ ] Range is normalized when the pointer is dragged upward.
- [ ] Range is clamped to the visible day/time window and respects `MIN_SLOT_SPAN_MINUTES`.

**Verification:**
- [ ] Add unit tests for downward drag, upward drag, minimum-span clamp, and visible-window clamp.
- [ ] Run package build and tests.

**Dependencies:** Task 1 can be parallel, but complete both before UI wiring.

**Files likely touched:**
- `web/packages/mai-ui-vue/src/board/model/slot-gesture.ts`
- `web/packages/mai-ui-vue/tests/slot-gesture.test.mjs`

**Estimated scope:** Small-Medium

Commit checkpoint: `add: compute blank grid drag slot drafts`

### Checkpoint: Foundation
- [ ] `pnpm --filter @mai/mai-ui-vue build`
- [ ] `pnpm --filter @mai/mai-ui-vue test`
- [ ] No UI behavior changed yet except exported/internal helper availability.

---

### Phase 2: Current-Time Indicator UI

## Task 3: Render Reusable Now Indicator in Day Columns

**Description:** Introduce a reusable now-indicator UI component and mount it inside week-board day columns. The component should only need top-position data and should not know about week layout internals.

**Acceptance criteria:**
- [ ] Now indicator rendering is isolated in a reusable component or clearly reusable UI helper.
- [ ] Now line renders only on the current day column.
- [ ] Now line does not render for other days.
- [ ] Now line does not render when current time is outside the visible window.
- [ ] Indicator is non-interactive and does not block slot/event pointer interactions.
- [ ] Component API can be reused by a future day view without requiring week-specific props.

**Verification:**
- [ ] Add or update tests for now indicator helper behavior.
- [ ] Manual check in example app with a visible current-time window.
- [ ] Run package build and tests.

**Dependencies:** Task 1

**Files likely touched:**
- `web/packages/mai-ui-vue/src/board/state/controller.ts`
- `web/packages/mai-ui-vue/src/MaiBoard.tsx`
- `web/packages/mai-ui-vue/src/board/ui/MaiDayColumn.tsx`
- `web/packages/mai-ui-vue/src/board/ui/MaiNowIndicator.tsx`
- `web/packages/mai-ui-vue/src/styles/calendar-grid.css`

**Estimated scope:** Medium

Commit checkpoint: `add: show reusable current time indicator on board`

## Task 4: Add Reusable Now Indicator Refresh Strategy

**Description:** Ensure consumers of the now indicator can update over time without over-rendering the board. Keep the timer/state reusable enough for week and future day views.

**Acceptance criteria:**
- [ ] Indicator updates at a reasonable interval, ideally once per minute.
- [ ] Timer is cleaned up when the board component unmounts.
- [ ] Server-side rendering remains safe.
- [ ] Timer logic is not coupled to week-specific layout assumptions.

**Verification:**
- [ ] Build succeeds.
- [ ] Tests pass.
- [ ] Manual check: indicator position changes after minute boundary or via injected/testable state if available.

**Dependencies:** Task 3

**Files likely touched:**
- `web/packages/mai-ui-vue/src/board/state/controller.ts`
- possibly `web/packages/mai-ui-vue/tests/board.test.mjs`

**Estimated scope:** Small

Commit checkpoint: `fix: refresh board now indicator over time`

### Checkpoint: Now Indicator
- [ ] Package build/test pass.
- [ ] Visual check on desktop and mobile scroll layout.
- [ ] No pointer interaction regression.

---

### Phase 3: Drag-to-Create Gesture

## Task 5: Add Blank Grid Pointer Drag State

**Description:** Add pointer lifecycle handling to `MaiDayColumn` for blank-space drag-to-create. Existing event cards must continue to stop propagation so event drag/resize is unaffected.

**Acceptance criteria:**
- [ ] Pointer down on blank grid starts a create-draft gesture.
- [ ] Pointer move updates a visible draft slot preview.
- [ ] Pointer up emits an empty-cell/create-draft payload using the dragged range.
- [ ] Simple click behavior still opens the default-duration create-slot overlay as it does today.
- [ ] Existing event card drag/resize behavior remains unchanged.

**Verification:**
- [ ] Add tests for drag helper math from Task 2.
- [ ] Manual check: click blank cell still works.
- [ ] Manual check: drag blank area creates the overlay with dragged start/end.
- [ ] Run package build and tests.

**Dependencies:** Task 2

**Files likely touched:**
- `web/packages/mai-ui-vue/src/board/ui/MaiDayColumn.tsx`
- `web/packages/mai-ui-vue/src/board/state/controller.ts`
- `web/packages/mai-ui-vue/src/types/board.ts`
- `web/packages/mai-ui-vue/src/interactive/state.ts`

**Estimated scope:** Medium

Commit checkpoint: `add: drag blank board space to create slot draft`

## Task 6: Wire Drag Draft Into Interactive Create Overlay

**Description:** Ensure drag-created drafts flow into `MaiBoardInteractive` and `MaiCreateSlotCard` with the dragged start/end range rather than only default duration.

**Acceptance criteria:**
- [ ] Drag-created draft preview uses the selected drag range.
- [ ] Create-slot card opens at the draft location after release.
- [ ] Edited start/end fields still normalize invalid ranges.
- [ ] `create-slot` payload remains unchanged.

**Verification:**
- [ ] Existing `interactive-board` tests pass.
- [ ] Add focused state test if the draft payload shape changes.
- [ ] Manual check in example app.

**Dependencies:** Task 5

**Files likely touched:**
- `web/packages/mai-ui-vue/src/MaiBoardInteractive.tsx`
- `web/packages/mai-ui-vue/src/interactive/state.ts`
- `web/packages/mai-ui-vue/src/actions/MaiCreateSlotCard.tsx`
- `web/packages/mai-ui-vue/tests/interactive-board.test.mjs`

**Estimated scope:** Medium

Commit checkpoint: `fix: use dragged slot range in create overlay`

## Task 7: Style Drag-to-Create Draft Feedback

**Description:** Make drag-created draft feedback visually clear while staying calm and consistent with existing slot-draft styling.

**Acceptance criteria:**
- [ ] Draft slot is visually distinct from real available slots.
- [ ] Draft feedback is visible during drag and after release until overlay opens.
- [ ] Styling uses design tokens and existing draft styles where possible.
- [ ] No gradient, decorative color, or excessive motion introduced.

**Verification:**
- [ ] Build/test pass.
- [ ] Manual visual check at 320, 768, 1024, and 1440 widths.

**Dependencies:** Task 5

**Files likely touched:**
- `web/packages/mai-ui-vue/src/board/ui/day-column/MaiDraftEventCard.tsx`
- `web/packages/mai-ui-vue/src/styles/event-card.css`
- `web/packages/mai-ui-vue/src/styles/calendar-grid.css`

**Estimated scope:** Small

Commit checkpoint: `polish: show drag create slot draft clearly`

### Checkpoint: Drag-to-Create
- [ ] Package build/test pass.
- [ ] Manual click blank cell.
- [ ] Manual drag blank cell down and up.
- [ ] Manual slot drag/resize still works.
- [ ] Manual appointment/slot click overlays still work.

---

### Phase 4: Documentation and Memory

## Task 8: Document Board Interaction Changes

**Description:** Update web UI docs and memory with the current-time indicator and drag-to-create behavior.

**Acceptance criteria:**
- [ ] Package README mentions now indicator and blank-space drag-to-create.
- [ ] Workspace web README mentions new board interaction behavior.
- [ ] `.agents/memory/` records completed scope, commits, and verification.
- [ ] This plan file is removed after implementation is complete.

**Verification:**
- [ ] Docs match actual exported behavior.
- [ ] Build/test status recorded.

**Dependencies:** Tasks 1-7

**Files likely touched:**
- `web/packages/mai-ui-vue/README.md`
- `web/README.md`
- `.agents/memory/board-now-indicator-and-drag-create-status.md`
- `.agents/plans/board-now-indicator-and-drag-create-plan.md`

**Estimated scope:** Small

Commit checkpoint: `docs: document board now indicator and drag create`

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Drag-to-create conflicts with event drag/resize | High | Start gesture only from day grid blank space; preserve event `stopPropagation` paths |
| Simple empty-cell click regresses | High | Keep click threshold; treat below-threshold pointer interaction as existing click behavior |
| Now indicator uses local time incorrectly for UTC-based week labels | Medium | Compare ISO dates carefully and document timezone assumption; consider view timezone in a follow-up if needed |
| Timer causes SSR/runtime issues | Medium | Guard browser-only interval setup and clean up on unmount |
| Draft range payload expands existing event shape | Medium | Keep backward-compatible fields; add optional start/end draft fields only if needed |
| Mobile scrolling conflicts with drag-to-create | Medium | Use pointer capture carefully and verify horizontal/vertical scroll behavior on mobile |

## Open Questions
- Should the now indicator use the browser local timezone initially, or should it respect a future board/day-view `timezone` prop?
- Should drag-to-create snap to 15 minutes, 5 minutes, or the component's `defaultSlotDurationMinutes` granularity?
- During drag-to-create, should the overlay open only on pointer up, or should it stay closed until the user clicks the draft?
