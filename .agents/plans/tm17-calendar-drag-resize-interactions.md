# Implementation Plan: TM17 Calendar Drag/Resize Slot Interactions

## Overview
Add mainstream calendar interactions to `@mai/mai-ui-vue`:
- drag slot block to move time/day
- resize slot from top or bottom edge to adjust time range

Target UX: close to Outlook/Google/Apple interaction quality while preserving deterministic core behavior.

## Why this is the next logical step
- Current UI supports create/select/action cards but not direct manipulation.
- Mainstream calendar usability depends on drag + resize for rapid editing.
- This feature requires explicit mutation support across core, adapter, and UI layers.

## Scope
- In scope: slot drag/resize contract, command model extension, adapter/web-core typing updates, UI gesture system, optimistic preview, tests/docs.
- Out of scope: recurring events, multi-select drag, touch-native gesture parity for all edge cases, appointment drag/resize in this phase.

## Tasks

### Task 1: Define reschedule command contract (spec + core boundary)
- Add a new slot-reschedule command payload (single command for move and resize):
  - `slot_id`
  - `new_start`
  - `new_end`
  - `updated_by`
- Keep existing invariants:
  - `start < end`
  - overlap rules by assignee still enforced
  - booked/cancelled slot behavior explicitly defined
- Update functional/technical spec and command model docs.

Acceptance criteria:
- Contract is explicit, deterministic, and backward-compatible with existing commands.

### Task 2: Implement core + adapter + web-core command support
- Core:
  - add command type and service method for slot time update.
- WASM adapter:
  - add new command variant and deterministic error mapping.
- `@mai/mai-web-core`:
  - add command constant and typed payload map entry.

Acceptance criteria:
- Command can be sent via existing typed envelope path.
- `cargo test` and web-core build/tests stay green.

### Task 3: Add drag/resize interaction model in UI package
- Add UI interaction primitives:
  - drag-start / drag-move / drag-end
  - resize-top-start / resize-bottom-start / move / end
- Add snap policy:
  - default 15-minute grid snapping
  - clamp to day bounds and visible window
- Add optimistic ghost preview while dragging/resizing.

Acceptance criteria:
- Slot block can be moved and resized with clear visual feedback.
- Interaction state remains deterministic and cancelable.

### Task 4: Wire interaction to mutation path
- On drop/resize end, emit new event payloads and/or dispatch command via `mutateCommand` mode:
  - `slot-rescheduled` success event
  - `interaction-error` on rejection/failure
- Keep action cards as fallback/manual controls.

Acceptance criteria:
- End-to-end drag/resize updates core state and refreshes layout.

### Task 5: Tests (core + ui + integration)
- Core tests:
  - valid reschedule
  - overlap rejection
  - invalid range rejection
- UI tests:
  - drag math + snapping
  - top/bottom resize math
  - deterministic payload mapping to reschedule command.
- Example build and workspace tests.

Acceptance criteria:
- `cargo test`
- `pnpm --filter @mai/mai-ui-vue test`
- `pnpm run test` in `web/`

### Task 6: Design polish + docs + workflow artifacts
- Apply `DESIGN.md` consistency:
  - clear drag handles on slot chip edges
  - strong focus/hover states, subtle ghost/elevation during drag
  - maintain spacing/typography/radius conventions
- Update docs with interaction notes and constraints.
- Add memory artifact and remove completed plan file.

Acceptance criteria:
- Interaction feels intentional and user-friendly on desktop.
- docs + memory artifacts completed.

## Commit checkpoints
1. `spec(core): define slot reschedule command for drag/resize interactions`
2. `feat(core): implement slot reschedule command across core and wasm/web boundaries`
3. `feat(ui): add draggable and resizable slot interactions with snap preview`
4. `test(ui): cover drag/resize math and reschedule payload mapping`
5. `docs(ui): align drag-resize interaction docs and finalize TM17 artifacts`
