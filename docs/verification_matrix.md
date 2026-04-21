# Verification Matrix (Functional Spec -> Tests)

This matrix maps `docs/functional_spec.md` functional requirements (FR) to current automated coverage.

Legend:
- `Covered`: direct automated coverage exists.
- `Partially Covered`: behavior exists but coverage is indirect or contract-level only.
- `Gap`: requirement needs additional explicit test coverage.

| FR | Requirement Summary | Status | Evidence |
|---|---|---|---|
| FR-1 | Render weekly view from anchor date, optional boundary timezone, 7-day semantic output | Covered | `core/src/layout/weekly_layout/tests.rs` (`computes_monday_aligned_week_for_midweek_anchor`, `week_range_always_spans_exactly_seven_days`), `core/tests/wasm_web_smoke.rs` (timezone query), `core/tests/serialization_contract.rs` (`wasm_adapter_wrapper_normalizes_timezone_aware_weekly_query_anchor`) |
| FR-2 | Display available slots only | Covered | `core/src/layout/weekly_layout/tests.rs` (`projects_only_available_slots_in_visible_week`, `slot_projection_never_leaks_booked_or_cancelled_slots`) |
| FR-3 | Display appointments in visible week, positioned by slot time, exclude missing-slot references | Covered | `core/src/layout/weekly_layout/tests.rs` (`projects_appointments_from_referenced_slot_time`, `includes_only_appointments_with_visible_referenced_slots`) |
| FR-4 | Add slot with shape and overlap validation | Covered | `core/src/application/scheduler_service.rs` tests (`rejects_overlapping_slots_for_same_assignee`), `core/src/domain/time_range.rs` tests (`rejects_start_after_end`, `rejects_equals_start_and_end`) |
| FR-5 | Delete slot by ID; reject when booked | Covered | `core/src/application/scheduler_service.rs` (`booked_slot_cannot_be_deleted`, `deleting_available_slot_removes_it_by_id`) |
| FR-6 | Cancel slot; prevent booking cancelled slots; reject cancel when booked | Covered | `core/src/application/scheduler_service.rs` (`cannot_book_cancelled_slot`, `cancelling_booked_slot_is_rejected`), `core/tests/end_to_end_flows.rs` (`cancel_then_booking_is_rejected`) |
| FR-7 | Add appointment books available slot and derives host from slot | Partially Covered | Booking transition is covered in `core/src/application/scheduler_service.rs` (`booking_creates_exactly_one_appointment_and_marks_slot_booked`); add a focused test that host semantics are derived from `slot.assignee` (host is not stored independently). |
| FR-8 | Delete appointment unbooks slot | Covered | `core/src/application/scheduler_service.rs` (`deleting_appointment_restores_slot_availability`), `core/tests/end_to_end_flows.rs` (`add_slot_book_unbook_and_layout_flow`) |
| FR-9 | Conflict validation (overlap, one appointment per slot, valid slot reference) | Covered | `core/src/validation/slot_validation.rs` overlap tests, `core/src/validation/appointment_validation.rs` (`rejects_when_slot_already_has_appointment`), `core/src/validation/invariants.rs` slot-reference invariant tests |
| FR-10 | Semantic layout output (no pixel/UI data) | Covered | `core/src/layout/weekly_layout/tests.rs` (day index, minute offsets, clipping, deterministic ordering); output DTOs in `core/src/layout/output.rs` |
| FR-11 | Week navigation (next/previous/jump) | Partially Covered | Jump-to-date is covered via anchor-date week projection tests in `core/src/layout/weekly_layout/tests.rs`; explicit next/previous navigation helper APIs are not separately defined in core service layer. |

## Notes
- Adapter contract stability and envelope/error determinism are additionally covered in:
  - `core/tests/serialization_contract.rs`
  - `core/tests/wasm_web_smoke.rs`
  - `core/tests/generated_package_smoke.mjs` (invoked via `core/tests/run_generated_package_smoke.sh`)
- If explicit FR-11 next/previous helper APIs are required (instead of consumer-provided anchor dates), add a dedicated core helper and corresponding tests.
