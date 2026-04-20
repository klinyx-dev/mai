# Project Recap (Current State)

Last updated: 2026-04-20  
Audience: new contributors joining `mai`

## 1) What This Project Is
`mai` is a **headless Rust scheduling core** for weekly medical booking workflows.

Key idea:
- Core logic is deterministic and platform-agnostic.
- UI frameworks, DOM/CSS, and pixel layout are intentionally out of scope.
- The same core can be consumed by Rust backends and web apps via WASM.

Current release line:
- `v0.1.0` released baseline
- `v0.1.1` patch release fixes generated-package smoke reliability in CI

## 2) Product Scope (What It Does Today)
The current model is a **fixed-slot booking system**:
- one slot = one bookable unit
- no partial booking
- one active appointment per slot
- slot status lifecycle: `available -> booked` and `booked -> available` when unbooked
- cancelled slots are retained but excluded from availability/layout

Supported operations:
- add/delete/cancel slot
- add/delete appointment
- compute semantic weekly layout (7-day window, no UI-specific output)

## 3) Architecture at a Glance
Main crate: `core/`

Important module boundaries:
- `domain`: typed entities and IDs (`SlotId`, `AppointmentId`, `ActorId`)
- `commands`: mutation DTOs
- `validation`: business rules and invariants
- `application`: orchestration (`SchedulerService`) and errors
- `layout`: weekly semantic projection logic
- `adapters/wasm`: JSON envelope adapter + wasm-bindgen export wrapper

Public API posture:
- stable crate-root re-exports for consumer-facing types
- WASM boundary is JSON-only for compatibility and determinism

## 4) Adapter Contract (Critical for Integrations)
WASM adapter is envelope-based JSON:
- command request: `{"command":"...","payload":{...}}`
- query request: `{"query":"...","payload":{...}}`
- success response: `{"status":"success","data":...}`
- error response: `{"status":"error","error":{"category","code","message"}}`

Exported wasm-bindgen wrapper:
- `WasmBindgenAdapter::new()`
- `execute_command_json(&str) -> String`
- `execute_query_json(&str) -> String`

This contract is intentionally stable and already covered by tests.

## 5) Milestone Status
Completed:
- TM1–TM5: core domain/state/validation/layout/serialization foundations
- TM6a: adapter contract + wrapper + error mapping
- TM6b: wasm-bindgen export wrapper
- TM6c: generated package build + JS consumption smoke validation
- TM7: optional actor lookup boundary + actor-reference validation hooks

TM7 implementation outcome:
- new optional application collaborator (`ActorLookup`)
- optional actor-reference checks when collaborator is configured
- new referential errors:
  - `assignee_not_found`
  - `creator_not_found`
- behavior unchanged when no collaborator is configured

## 6) Testing and CI
Core local checks:
- `cargo fmt --all --check`
- `cargo clippy --all-targets --all-features -- -D warnings`
- `cargo test`
- `cargo check --target wasm32-unknown-unknown -p mai`
- `core/tests/run_generated_package_smoke.sh`

Hosted CI (`.github/workflows/ci.yml`):
- `rust-quality` job (fmt/clippy/test)
- `wasm-package-smoke` job (wasm target + wasm-pack + Node smoke run)

## 7) Dev Tooling and Alternate Workflow
Optional containerized workflow exists for teams that prefer Podman:
- `Containerfile`
- `Makefile.toml` (`cargo make check/test/fmt/clippy/wasm-check/wasm-smoke/ci`)
- `README-dev.md` usage guide

This is useful for reproducible local environments but not required if native Rust tooling is available.

## 8) Release and Branch Policy
Release policy is now explicit:
- `main` is the **stable release branch**
- release PRs must merge into `main` before tagging
- version tags must be created from commits already on `main`

See:
- `README.md` release checklist
- `AGENTS.md` release branch policy

## 9) Specs, Decisions, and Memory (Where to Read First)
Primary specs:
- `docs/functional_spec.md`
- `docs/technical_spec.md`

Architectural decision records:
- `docs/decisions/ADR-001-near-term-core-decisions.md`

Execution history snapshots:
- `.agents/memory/*.md` (bootstrap, wasm milestones, release stabilization, TM7)

## 10) Known Gaps / Intentional Non-Goals
Not implemented yet (by design for this phase):
- recurrence engine
- advanced timezone conversion rules
- permissions/ACL
- persistence abstraction with full DB integration
- drag-and-drop / UI concerns

Some placeholder files remain in `state/` and `layout/` for future expansion (acceptable in current scope).

## 11) Practical Guidance for New Contributors
If you are adding behavior:
1. Update specs first if behavior changes contract/rules.
2. Keep domain/layout headless and deterministic.
3. Preserve JSON envelope shape unless an intentional versioned contract change is approved.
4. Add tests at the right level:
   - rule-level unit tests
   - service flow tests
   - adapter serialization/contract tests
5. Run full validation commands before opening PR.

If you are changing release/integration behavior:
1. Update `CHANGELOG.md`.
2. Ensure CI smoke path still uses `core/tests/generated_package_smoke.mjs`.
3. Follow main-branch release policy.

## 12) Bottom Line
The project is in a strong, stable state:
- deterministic core is complete for Phase 1 scope
- WASM packaging/consumption is verified in CI
- release process is formalized
- TM7 laid groundwork for stricter actor validation without breaking existing integrations

The next meaningful work should build on TM7 (or move into the next clearly-scoped feature milestone) without weakening the existing adapter contract guarantees.
