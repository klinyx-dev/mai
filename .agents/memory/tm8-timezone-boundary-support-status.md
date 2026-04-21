# TM8 Timezone Boundary Support Status

## Date
2026-04-21

## Scope Completed
TM8 delivered timezone-aware weekly query handling at the adapter boundary while keeping core domain/layout logic deterministic and UTC-based.

## What Shipped

### 1) Timezone-aware query contract
- Added adapter query payload:
  - `WasmWeeklyLayoutQuery { anchor_date, timezone?: String }`
- Kept backward compatibility:
  - legacy payloads with only `anchor_date` remain valid

### 2) Adapter boundary normalization
- Implemented adapter-side normalization from `anchor_date + timezone` to effective UTC anchor date before calling core `WeeklyLayoutQuery`.
- Kept timezone logic out of core domain/layout modules.

### 3) Deterministic timezone error handling
- Invalid timezone input now returns deterministic contract error:
  - `category = contract`
  - `code = invalid_timezone`
  - `message = invalid timezone value`
- Error envelope shape remains unchanged.

### 4) Tests and docs
- Added/updated adapter serialization and behavior tests for:
  - legacy query payload
  - timezone-enabled query payload
  - invalid-timezone deterministic error mapping
- Extended web-consumer smoke coverage for TM8 behavior.
- Updated usage/payload docs with migration-safe examples.

## Verification Snapshot
- `cargo fmt --all --check`: pass
- `cargo clippy --all-targets --all-features -- -D warnings`: pass
- `cargo test`: pass
- `cargo check --target wasm32-unknown-unknown -p mai`: pass
- `core/tests/run_generated_package_smoke.sh`: blocked locally due to missing `wasm-pack` executable

## Notes
- TM8 feature behavior is complete in code/docs/tests.
- Remaining gap is environment/tooling reliability for local generated-package smoke execution (tool availability), not TM8 logic itself.
