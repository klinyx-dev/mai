# Implementation Plan: TM8 Timezone Boundary Support

## Overview
Add timezone-aware weekly query support at the adapter boundary while keeping core domain/layout logic deterministic and UTC-based.

## Scope
- In scope: timezone-aware query payload, adapter normalization rules, deterministic error mapping, docs/tests.
- Out of scope: recurrence, timezone-aware core entities, persistence changes, UI formatting logic.

## Tasks

### Task 1: Define timezone-aware weekly query contract
- Extend adapter query payload for `weekly_layout` with optional timezone field.
- Keep backward compatibility for existing UTC-only callers.

Decision recorded:
- Added adapter-specific `WasmWeeklyLayoutQuery { anchor_date, timezone?: String }`.
- `WasmQueryRequest::WeeklyLayout` now uses adapter payload type (not core `WeeklyLayoutQuery` directly).
- Legacy payloads with only `anchor_date` remain valid (`timezone` is optional).
- Timezone normalization/validation is intentionally deferred to Task 2/3.

Acceptance criteria:
- Existing payload remains valid.
- New timezone payload shape is documented with examples.

### Task 2: Implement adapter boundary normalization
- Normalize `anchor_date + timezone` into effective UTC week anchor before calling core layout logic.
- Keep domain/layout modules free of timezone conversion rules.

Decision recorded:
- Added adapter-side normalization from `WasmWeeklyLayoutQuery` to core `WeeklyLayoutQuery`.
- Normalization converts local anchor date in provided timezone to effective UTC anchor date before week computation.
- Domain/layout modules remain unchanged and timezone-free.
- Invalid timezone fallback remains legacy-compatible in Task 2; deterministic invalid-timezone error mapping is handled in Task 3.

Acceptance criteria:
- Same inputs produce deterministic normalized behavior.
- No core domain model changes required for timezone representation.

### Task 3: Add deterministic error handling for timezone input
- Validate timezone field at boundary.
- Map invalid timezone inputs to stable adapter error code/messages.

Decision recorded:
- Invalid timezone inputs now return adapter error envelope:
  - `category = contract`
  - `code = invalid_timezone`
  - `message = invalid timezone value`
- Invalid timezone no longer falls back to legacy anchor behavior.
- Error envelope structure remains unchanged.

Acceptance criteria:
- Invalid timezone input never escapes as raw parse/runtime errors.
- Error envelope shape remains unchanged.

### Task 4: Tests and docs
- Add adapter/query tests for timezone-enabled and legacy payloads.
- Add invalid-timezone error tests.
- Update usage and payload docs with migration-safe examples.

Verification:
- `cargo fmt --all --check`
- `cargo clippy --all-targets --all-features -- -D warnings`
- `cargo test`
- `cargo check --target wasm32-unknown-unknown -p mai`
- `core/tests/run_generated_package_smoke.sh`

## Commit Checkpoints
1. `spec: define TM8 timezone query boundary contract`
2. `feat: normalize timezone-aware weekly query at adapter boundary`
3. `test: cover timezone query compatibility and invalid timezone errors`
4. `docs: update adapter usage and payload examples for TM8`
