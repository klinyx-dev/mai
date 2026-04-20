# Implementation Plan: Release `v0.1.0` Stabilization

## Overview
Stabilize the completed TM1-TM6c baseline for external Rust and WASM consumers by locking technical decisions, aligning docs, and defining deterministic release gates.

## Scope
- In scope: decision closure, metadata/docs hardening, release checklist, memory hygiene.
- Out of scope: new scheduling features, payload shape changes, adapter API redesign.

## Tasks

### Task 1: Lock near-term technical decisions
- Convert technical spec "open" decisions into accepted decisions.
- Align functional spec language with accepted actor-validation approach.
- Record decisions in an ADR.

Verification:
- `docs/technical_spec.md` and `docs/functional_spec.md` are consistent.
- ADR exists under `docs/decisions/`.

### Task 2: Release metadata and changelog
- Add missing crate metadata used by consumers/tooling.
- Add `CHANGELOG.md` entry for `0.1.0`.
- Add release-baseline contract guarantees and checklist to README.

Verification:
- `wasm-pack` warning about missing metadata is resolved.
- changelog and README release sections are present.

### Task 3: Memory and plan hygiene
- Update stale memory files that still reference completed "next steps".
- Add release stabilization memory snapshot.
- Remove completed/stale plan files.

Verification:
- `.agents/memory/` reflects current milestone state.
- `.agents/plans/` only contains active plans.

### Task 4: Gate validation
- Run full quality and compatibility checks before release/tagging.

Verification:
- `cargo fmt --all --check`
- `cargo clippy --all-targets --all-features -- -D warnings`
- `cargo test`
- `cargo check --target wasm32-unknown-unknown -p mai`
- `core/tests/run_generated_package_smoke.sh`

## Commit Checkpoint
`chore: stabilize v0.1 release docs, decisions, and project memory`
