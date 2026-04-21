# TM10 Core Weekly Query Filters and Visible Window Status

## Date
2026-04-21

## Scope Completed
TM10 delivered core weekly query expressiveness with optional assignee filtering and visible-hour window support, plus deterministic validation and projection behavior.

## What Shipped

### 1) Weekly query contract extensions
- Extended `WeeklyLayoutQuery` with:
  - `assignee_id: Option<ActorId>`
  - `visible_start_minute: Option<u16>`
  - `visible_end_minute: Option<u16>`
- Preserved backward compatibility for callers that only provide `anchor_date`.

### 2) Assignee-aware projection filtering
- Slot projection now filters by query `assignee_id` when present.
- Appointment projection now filters by referenced slot assignee when `assignee_id` is present.
- Deterministic sorting behavior remains stable with and without filters.

### 3) Visible-hour window behavior and validation
- Added deterministic visible-minute-window resolution with structural validation:
  - bounds constrained to `0..=1440`
  - `visible_start_minute < visible_end_minute`
- Added structural error variant for invalid windows:
  - `StructuralError::InvalidVisibleWindow`
- Applied clipping/filtering semantics to slot and appointment projections.

### 4) Service and adapter alignment
- Added checked layout API:
  - `SchedulerService::get_weekly_layout_checked(...) -> Result<WeeklyLayout, SchedulerError>`
- Existing `get_weekly_layout(...)` remains available and delegates to checked behavior.
- Mapped `InvalidVisibleWindow` through wasm error code mapping as `invalid_visible_window`.

### 5) Tests and docs
- Added deterministic filtered-order coverage:
  - `filtered_projections_are_identical_across_insertion_orders`
- Existing TM10 behavior tests cover:
  - assignee filtering for slots and appointments
  - visible-window clipping/filtering for slots and appointments
  - invalid query window rejection
- Updated docs:
  - `docs/verification_matrix.md`: FR-12 and FR-13 moved from Gap to Covered
  - `docs/technical_spec.md`: TM10 milestone marked completed and checked query API documented

## Verification Snapshot
- `cargo fmt --all --check`
- `cargo clippy --all-targets --all-features -- -D warnings`
- `cargo test`

All commands passed.
