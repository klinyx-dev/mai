# Implementation Plan: mai-ui-vue Hardening

## Overview
Stabilize `web/packages/mai-ui-vue` after recent refactors by tightening public event contracts, removing remaining API drift, improving accessibility for slot interactions, and polishing responsive behavior to match `DESIGN.md` without changing core scheduling behavior.

## Architecture Decisions
- Keep one public event source per surface:
  - `MAI_BOARD_EVENTS` for low-level board.
  - `MAI_BOARD_INTERACTIVE_EVENTS` for `MaiBoardInteractive`.
  - Add equivalent constants for booking flow/events.
- Preserve existing behavioral semantics:
  - No domain command changes.
  - No mutation flow changes (`bookSlot` / `mutateCommand` fallback remains unchanged).
- Prioritize interaction correctness and accessibility before UI cosmetics.

## Task List

### Phase 1: Event/API Contract Cleanup

## Task 1: Centralize booking flow event constants
**Description:** Introduce booking event constants and replace inline public event strings in `MaiBookingFlow` and booking leaf components where events cross component boundaries.

**Acceptance criteria:**
- [ ] Booking flow public events are declared in one constants module.
- [ ] `emit("...")` for public booking events is replaced by constants.
- [ ] Package exports include the new booking event constants and event union type.

**Verification:**
- [ ] Build passes: `pnpm --filter @mai/mai-ui-vue build`
- [ ] Tests pass: `pnpm --filter @mai/mai-ui-vue test`
- [ ] Public API tests include booking event constants exports.

**Dependencies:** None  
**Files likely touched:**
- `web/packages/mai-ui-vue/src/MaiBookingFlow.tsx`
- `web/packages/mai-ui-vue/src/types/booking.ts`
- `web/packages/mai-ui-vue/src/index.ts`
- `web/packages/mai-ui-vue/tests/public-api.test.mjs`
**Estimated scope:** Medium

Commit checkpoint: `refactor: centralize booking flow events`

## Task 2: Consolidate event payload validators
**Description:** Move duplicated event payload checks into shared validators to reduce drift between emits typing and runtime guards.

**Acceptance criteria:**
- [ ] Validator helpers cover booking and interactive payloads used by emits.
- [ ] Component-level emits use shared validators where applicable.
- [ ] No behavior changes in emitted payload acceptance.

**Verification:**
- [ ] Build passes.
- [ ] Tests pass.
- [ ] Existing interaction tests remain green without fixture rewrites.

**Dependencies:** Task 1  
**Files likely touched:**
- `web/packages/mai-ui-vue/src/board/api/validators.ts`
- `web/packages/mai-ui-vue/src/booking/*`
- `web/packages/mai-ui-vue/src/interactive/board-interactive-contract.ts`
**Estimated scope:** Medium

Commit checkpoint: `refactor: share ui event validators`

### Checkpoint: Phase 1
- [ ] `pnpm --filter @mai/mai-ui-vue build`
- [ ] `pnpm --filter @mai/mai-ui-vue test`
- [ ] No new plain-string public event names introduced in touched files.

---

### Phase 2: Accessibility and Interaction Hardening

## Task 3: Pointer-safe slot drag/resize
**Description:** Replace mouse-only interaction hooks with pointer-aware handlers where needed for slot move/resize paths.

**Acceptance criteria:**
- [ ] Slot drag/resize works with mouse and touch pointer input.
- [ ] Existing move/resize snapping and payload semantics are unchanged.
- [ ] No regression in slot gesture tests.

**Verification:**
- [ ] Build passes.
- [ ] Tests pass, including `slot-gesture` and `interactive-board`.
- [ ] Manual smoke on desktop and touch simulation.

**Dependencies:** Phase 1 complete  
**Files likely touched:**
- `web/packages/mai-ui-vue/src/board/ui/MaiEventCard.tsx`
- `web/packages/mai-ui-vue/src/board/ui/event-card/MaiEventResizeHandles.tsx`
- `web/packages/mai-ui-vue/src/board/ui/event-card/helpers.ts`
**Estimated scope:** Medium

Commit checkpoint: `fix: support pointer interactions for board events`

## Task 4: Keyboard-accessible resize controls
**Description:** Ensure resize handles are keyboard-operable and discoverable with clear accessible labels.

**Acceptance criteria:**
- [ ] Resize controls are focusable and keyboard-operable.
- [ ] ARIA labeling distinguishes top/bottom resize actions.
- [ ] No keyboard trap introduced in event cards.

**Verification:**
- [ ] Build passes.
- [ ] Tests pass.
- [ ] Manual keyboard pass: tab, enter/space, arrow behavior (if implemented).

**Dependencies:** Task 3  
**Files likely touched:**
- `web/packages/mai-ui-vue/src/board/ui/event-card/MaiEventResizeHandles.tsx`
- `web/packages/mai-ui-vue/src/board/ui/MaiEventCard.tsx`
- related style files under `src/styles/`
**Estimated scope:** Small-Medium

Commit checkpoint: `fix: make board resize controls accessible`

## Task 5: Announce availability async state
**Description:** Improve booking availability loading/refresh semantics for assistive tech (`aria-live`, `aria-busy`) and normalize typography punctuation.

**Acceptance criteria:**
- [ ] Availability loading state uses `aria-live`/`aria-busy` semantics.
- [ ] Loading copy uses consistent punctuation.
- [ ] No visual regressions in booking panels.

**Verification:**
- [ ] Build passes.
- [ ] Tests pass.
- [ ] Manual screen-reader-friendly check of availability status updates.

**Dependencies:** Task 1  
**Files likely touched:**
- `web/packages/mai-ui-vue/src/booking/MaiAvailabilityPicker.tsx`
- `web/packages/mai-ui-vue/src/styles/booking.css`
**Estimated scope:** Small

Commit checkpoint: `fix: announce booking availability updates`

### Checkpoint: Phase 2
- [ ] Full build + test green.
- [ ] Manual keyboard pass on interactive board.
- [ ] Manual touch/mouse pass on slot drag+resize.

---

### Phase 3: Responsive and Design-System Polish

## Task 6: Mobile board overflow behavior
**Description:** Decide and implement explicit mobile strategy for admin board width (`min-width` vs compact mode), preserving usability and visual coherence.

**Acceptance criteria:**
- [ ] Mobile behavior is explicit and consistent (scroll container and affordance, or compact rendering).
- [ ] No clipped interactive elements on 320px width.
- [ ] Timeline readability remains acceptable.

**Verification:**
- [ ] Build passes.
- [ ] Tests pass.
- [ ] Manual viewport checks at 320 / 768 / 1024 / 1440.

**Dependencies:** Phase 2 complete  
**Files likely touched:**
- `web/packages/mai-ui-vue/src/styles/responsive.css`
- `web/packages/mai-ui-vue/src/styles/calendar-grid.css`
- optionally `web/packages/mai-ui-vue/src/MaiBoard.tsx`
**Estimated scope:** Medium

Commit checkpoint: `fix: clarify mobile board overflow behavior`

## Task 7: Booking UI alignment with DESIGN.md
**Description:** Audit booking components against `DESIGN.md` tokens and interaction rules; adjust only where current implementation diverges.

**Acceptance criteria:**
- [ ] Booking components consistently use design tokens.
- [ ] Focus-visible, disabled, and selected states are visually consistent.
- [ ] No ad-hoc styles that conflict with design-system guidance.

**Verification:**
- [ ] Build passes.
- [ ] Tests pass.
- [ ] Visual review of booking steps in example app.

**Dependencies:** Task 5  
**Files likely touched:**
- `web/packages/mai-ui-vue/src/booking/*.tsx`
- `web/packages/mai-ui-vue/src/styles/booking.css`
- `web/packages/mai-ui-vue/src/styles/tokens.css` (if needed)
**Estimated scope:** Medium

Commit checkpoint: `polish: align booking ui with design system`

### Checkpoint: Phase 3
- [ ] Build/test green.
- [ ] Responsive pass complete.
- [ ] Accessibility smoke pass complete.

---

### Phase 4: Documentation and Memory

## Task 8: Update docs and agent memory
**Description:** Record the hardened event contracts and interaction behavior in package docs and `.agents/memory`.

**Acceptance criteria:**
- [ ] `web/README.md` and/or package README reflects current event constants and usage.
- [ ] `.agents/memory/` contains a concise implementation status record.
- [ ] Plan file is removed after completion per workflow rule.

**Verification:**
- [ ] Docs reviewed for consistency with exported API.
- [ ] Memory entry added with commit references and test status.

**Dependencies:** Phase 1-3 complete  
**Files likely touched:**
- `web/README.md`
- `web/packages/mai-ui-vue/README.md`
- `.agents/memory/mai-ui-vue-package-hardening-status.md` (append/update)
- `.agents/plans/mai-ui-vue-hardening-plan.md` (delete when done)
**Estimated scope:** Small

Commit checkpoint: `docs: document ui event contracts and hardening status`

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Pointer-event refactor regresses drag behavior | High | Keep payload semantics and reuse existing gesture helpers; run slot gesture tests after each edit |
| Event constant migration causes API mismatch | Medium | Export constants and assert them via `public-api.test.mjs` |
| Responsive changes reduce timeline usability | Medium | Explicit viewport verification and retain scroll-first fallback |
| Accessibility changes break existing keyboard flows | Medium | Manual tab-order and activation checks after each interaction change |

## Open Questions
- Should admin board mobile mode remain horizontal-scroll-first as a product decision, or should we introduce a compact/mobile-specific timeline mode now?
- For keyboard resize, do you prefer incremental minute-step behavior (e.g. 15-minute arrows) or explicit action buttons only?
