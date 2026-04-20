# Release `v0.1.0` Stabilization Status

## Date
2026-04-20

## Scope
Capture completion of release hardening after TM6c to provide a tag-ready baseline for Rust and WASM consumers.

## Completed Outcomes

1. Decision closure
- Locked technical decisions in `docs/technical_spec.md` (status terminology, ID ownership, actor reference handling, cancelled-slot retention).
- Aligned functional spec actor-validation wording to opaque actor references.
- Added ADR-001 documenting accepted near-term decisions and tradeoffs.

2. Release metadata and consumer docs
- Added package metadata in `core/Cargo.toml`:
  - `description`
  - `license`
  - `repository`
- Added `CHANGELOG.md` with `0.1.0` release notes.
- Added release baseline guarantees and release checklist in `README.md`.

3. Plan and memory hygiene
- Updated stale "next step" memory references in:
  - `.agents/memory/wasm-adapter-status.md`
  - `.agents/memory/project-bootstrap-status.md`
- Removed completed legacy plan files:
  - `.agents/plans/project-bootstrap.md`
  - `.agents/plans/task-6-weekly-layout-plan.md`

## Verification Snapshot
- `cargo fmt --all --check`: passed
- `cargo clippy --all-targets --all-features -- -D warnings`: passed
- `cargo test`: passed
- `cargo check --target wasm32-unknown-unknown -p mai`: passed
- `core/tests/run_generated_package_smoke.sh`: passed

## Contract Baseline (unchanged)
- `WasmBindgenAdapter` remains JSON-only:
  - `new()`
  - `execute_command_json(&str) -> String`
  - `execute_query_json(&str) -> String`
- Command/query and success/error JSON envelope shapes remain stable.
