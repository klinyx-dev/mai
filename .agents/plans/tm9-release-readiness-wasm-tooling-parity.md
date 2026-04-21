# Implementation Plan: TM9 Release Readiness and Local WASM Tooling Parity

## Overview
Close the remaining release-readiness gap after TM8 by making generated-package smoke checks reproducible both in CI and local developer environments.

## Scope
- In scope: local tooling prerequisites, deterministic smoke workflow, docs updates, and validation script hardening.
- Out of scope: adapter contract changes, domain/business-rule changes, or new scheduling features.

## Tasks

### Task 1: Define local toolchain contract for WASM smoke
- Document required tool versions and installation checks for:
  - `rustup target wasm32-unknown-unknown`
  - `wasm-pack`
  - Node.js runtime used by generated package smoke test
- Add explicit preflight verification commands.

Acceptance criteria:
- A contributor can run one documented preflight command set and know whether the environment is ready.
- CI and local prerequisites are aligned and explicit.

### Task 2: Harden smoke workflow scripts
- Update `core/tests/run_generated_package_smoke.sh` (or adjacent scripts) to:
  - fail fast with actionable messages when required tools are missing
  - keep deterministic command flow and output
- Ensure the script remains safe for local and CI usage.

Acceptance criteria:
- Missing-tool failures are clear and actionable.
- Successful runs execute full package smoke flow without manual patching.

### Task 3: Add release-readiness verification pass
- Add or update a single documented command sequence covering:
  - format/lint/test
  - wasm target check
  - generated package smoke
- Ensure docs and workflow artifacts point to the same canonical verification path.

Acceptance criteria:
- One near-term verification sequence is documented and repeatable.
- No contradictory commands remain across docs/workflow files.

### Task 4: Finalize docs and memory artifacts
- Update relevant docs (usage/dev workflow/release notes as needed).
- Capture TM9 completion status in `.agents/memory/`.
- Remove finished TM9 plan from `.agents/plans/` once complete.

Acceptance criteria:
- Docs reflect the final validated workflow.
- Memory entry records what shipped and what was verified.

## Verification
- `cargo fmt --all --check`
- `cargo clippy --all-targets --all-features -- -D warnings`
- `cargo test`
- `cargo check --target wasm32-unknown-unknown -p mai`
- `core/tests/run_generated_package_smoke.sh`

## Commit Checkpoints
1. `spec: define TM9 local wasm smoke tooling contract`
2. `chore: harden generated package smoke preflight and failure messages`
3. `docs: align release-readiness verification workflow`
4. `chore: record TM9 completion memory and clear finished plan`
