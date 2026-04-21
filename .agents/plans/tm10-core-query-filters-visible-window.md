# Implementation Plan: TM10 Core Weekly Query Filters and Visible Time Window

## Overview
Expand core weekly query expressiveness with optional assignee filtering and optional visible-hour window constraints, while preserving deterministic output and headless architecture.

## Scope
- In scope:
  - core `WeeklyLayoutQuery` contract extensions
  - deterministic layout filtering/projection behavior
  - structural validation for query window constraints
  - tests and docs
- Out of scope:
  - adapter payload changes in this milestone
  - UI rendering/pixel behavior
  - recurrence/timezone core model changes

## Tasks

### Task 1: Define core query contract extensions
- Extend `WeeklyLayoutQuery` with optional:
  - `assignee_id`
  - `visible_start_minute`
  - `visible_end_minute`
- Keep existing `anchor_date`-only callers backward compatible.

Acceptance criteria:
- Existing callers compile and behavior remains unchanged when new fields are omitted.
- Contract is documented with examples.

### Task 2: Implement assignee-aware projection filtering
- Apply `assignee_id` filter during slot and appointment projection.
- For appointments, filter by referenced slot assignee deterministically.

Acceptance criteria:
- Filtered query returns only matching assignee data.
- Unfiltered query behavior remains unchanged.

### Task 3: Implement visible-hour window behavior
- Apply optional minute-window clipping/filtering in projection.
- Enforce structural query validation:
  - minute bounds within `0..=1440`
  - `visible_start_minute < visible_end_minute`

Acceptance criteria:
- Output is clipped/filter-consistent for windowed queries.
- Invalid query windows fail deterministically with typed structural errors.

### Task 4: Tests and docs
- Add/extend layout tests for:
  - assignee filtering
  - visible window clipping/filtering
  - invalid query window validation
  - deterministic ordering under filters
- Update specs/docs and verification matrix.

Acceptance criteria:
- New query behavior is covered by deterministic tests.
- Docs are aligned and implementation-ready.

## Verification
- `cargo fmt --all --check`
- `cargo clippy --all-targets --all-features -- -D warnings`
- `cargo test`

## Commit Checkpoints
1. `spec: define TM10 core weekly query filter and visible window contract`
2. `feat: apply assignee filter in weekly projections`
3. `feat: add visible-hour window behavior and query validation`
4. `test/docs: cover TM10 query behavior and update matrix`
