# Task 6 Plan: Weekly Layout Engine

## Objective
Implement the Phase 3 Task 6 weekly layout engine so `SchedulerService` can return deterministic, semantic weekly layout output from core state, with no UI/pixel logic.

Spec references:
- `docs/technical_spec.md` sections 10.1-10.6, 11.1-11.3, 13.3
- `docs/functional_spec.md` FR-1, FR-2, FR-3, FR-10

## Scope
In scope:
- Add `WeeklyLayoutQuery` (`anchor_date`)
- Add layout DTOs: `WeeklyLayout`, `SlotLayoutNode`, `AppointmentLayoutNode`
- Build week filtering + minute offset + clipping logic
- Deterministic ordering of output
- Wire `SchedulerService::get_weekly_layout`
- Add layout-focused unit tests

Out of scope:
- Pixel math / UI coordinates / rendering
- Recurrence / partial booking / timezone conversions
- Overlap grouping (optional per spec, defer unless needed)

## Key Decisions
- Week window is `[week_start, week_end)` (exclusive end) with 7 days.
- Slot nodes include only slots with `status = Available`.
- Appointment nodes include appointments whose referenced slot intersects visible week.
- Time is interpreted from slot timestamps already stored in UTC; no adapter timezone conversion inside core.
- Deterministic sort keys:
  1. `day_index`
  2. `start_minute`
  3. `end_minute`
  4. stable ID tie-break (`slot_id` / `appointment_id`)

## Task Breakdown

### Task 6.1: Define layout query/output contracts
Description:
Create layout-facing DTOs in `layout/output.rs` and query type for weekly requests.

Acceptance criteria:
- Public structs compile and derive serde traits.
- Output shape matches technical spec fields.

Likely files:
- `core/src/layout/output.rs`
- `core/src/layout/mod.rs`

Verification:
- `cargo test layout`

### Task 6.2: Implement week boundary and clipping utilities
Description:
Implement pure helpers to compute week start/end from anchor date and clip ranges to visible week/day boundaries.

Acceptance criteria:
- Given any anchor date, computed range always covers exactly 7 days.
- Clipping flags correctly indicate truncation at week bounds.

Likely files:
- `core/src/layout/weekly_layout.rs`
- `core/src/layout/clipping.rs`

Verification:
- Add unit tests for boundary dates and clipping behavior.
- `cargo test layout`

### Task 6.3: Implement slot layout projection
Description:
Project `Available` slots into `SlotLayoutNode` with day index + minute offsets, excluding booked/cancelled slots.

Acceptance criteria:
- FR-2 satisfied: only available slots appear in slot nodes.
- Minute offsets are within day semantics and deterministic.

Likely files:
- `core/src/layout/weekly_layout.rs`
- `core/src/layout/output.rs`

Verification:
- Tests for filtering and minute offsets.
- `cargo test layout`

### Task 6.4: Implement appointment layout projection
Description:
Project appointments via referenced slot time into `AppointmentLayoutNode`, preserving clipping and deterministic sort.

Acceptance criteria:
- FR-3 satisfied: appointments in visible week are included.
- Appointment position is derived from slot time only.
- Invalid slot reference cannot silently pass (should be rejected or excluded by invariant assumptions).

Likely files:
- `core/src/layout/weekly_layout.rs`

Verification:
- Tests for inclusion/exclusion by week and deterministic order.
- `cargo test layout`

### Task 6.5: Service integration
Description:
Expose `get_weekly_layout(&self, query: WeeklyLayoutQuery) -> WeeklyLayout` in `SchedulerService`.

Acceptance criteria:
- Service delegates to layout engine with no business rule duplication.
- Existing mutation flows remain unchanged.

Likely files:
- `core/src/application/scheduler_service.rs`
- `core/src/application/mod.rs`

Verification:
- `cargo test application`
- `cargo test layout`

### Task 6.6: Determinism + regression tests
Description:
Add deterministic output tests under shuffled insertion order and mixed slot statuses.

Acceptance criteria:
- Same semantic state yields identical ordered output regardless of map insertion order.
- Booked/cancelled slots never leak into slot nodes.

Likely files:
- `core/src/layout/weekly_layout.rs` (test module)
- optional dedicated test file under `core/tests/`

Verification:
- `cargo test layout`
- `cargo test`

## Checkpoints
- Checkpoint A (after 6.2): boundaries and clipping stable with tests.
- Checkpoint B (after 6.4): both slot/appointment projections complete and sorted.
- Checkpoint C (after 6.6): full suite green and deterministic guarantees validated.

## Risks and Mitigations
- Risk: day/minute calculations drift at boundaries.
  - Mitigation: explicit helper functions + edge-case tests (start/end of week, midnight edges).
- Risk: implicit timezone behavior leaks in.
  - Mitigation: keep UTC-only assumptions in core and avoid local-time APIs.
- Risk: nondeterministic ordering from `HashMap`.
  - Mitigation: always collect then explicit sort by stable key tuple.

## Definition of Done
- `SchedulerService::get_weekly_layout` exists and returns spec-compliant semantic DTOs.
- Layout filtering matches FR-2 and FR-3.
- Deterministic ordering and clipping are tested.
- `cargo test layout` and `cargo test` pass.
