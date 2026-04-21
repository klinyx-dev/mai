# TM9 Release Readiness and Local WASM Tooling Parity Status

## Date
2026-04-21

## Scope Completed
TM9 delivered local/CI-aligned tooling contract documentation, hardened generated-package smoke preflight behavior, and one canonical release-readiness verification sequence across workflow docs.

## What Shipped

### 1) Local toolchain contract for smoke
- Documented explicit local prerequisites aligned to CI:
  - Rust stable
  - `wasm32-unknown-unknown` target
  - `wasm-pack`
  - Node.js `22.x`
- Added concrete preflight command set in:
  - `README.md`
  - `docs/wasm_adapter_usage.md`

### 2) Hardened smoke workflow script
- Updated `core/tests/run_generated_package_smoke.sh` with deterministic preflight checks:
  - required commands: `rustup`, `wasm-pack`, `node`
  - required Rust target: `wasm32-unknown-unknown`
- Added actionable failure messages for missing prerequisites.
- Replaced opaque artifact assertions with explicit missing-file errors.

### 3) Canonical verification sequence alignment
- Standardized one near-term release-readiness sequence in `README.md`:
  - `cargo fmt --all --check`
  - `cargo clippy --all-targets --all-features -- -D warnings`
  - `cargo test`
  - `cargo check --target wasm32-unknown-unknown -p mai`
  - `core/tests/run_generated_package_smoke.sh`
- Aligned container workflow docs:
  - `README-dev.md` now treats `cargo make ci` as the containerized equivalent of that same sequence.
- Linked `docs/wasm_adapter_usage.md` smoke step back to the canonical README sequence.

## Verification Snapshot
- `bash core/tests/run_generated_package_smoke.sh`: fail-fast behavior verified with actionable output in this host environment.
  - Observed message: missing required command `rustup`.

## Notes
- TM9 implementation scope is complete (docs + script hardening + workflow alignment).
- Remaining failure is environment-specific prerequisite availability, not script/contract behavior.
