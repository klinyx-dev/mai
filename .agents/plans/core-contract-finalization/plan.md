# Implementation Plan: Core Contract Finalization

## Overview
Finish the core contract hardening work by validating the full repository, documenting the duplicate-ID command contract, and recording the outcome for future contributors and agents.

## Goals
- Run full local validation across Rust, wasm packaging, and web workspace.
- Document that create commands reject duplicate IDs instead of overwriting existing records.
- Summarize completed work under `.agents/memory/`.
- Decide whether the completed plan folders should be removed from `.agents/plans/`.

## Non-Goals
- No new core behavior unless validation exposes a real defect.
- No persistence, recurrence, auth, or UI work.
- No broad README rewrite.

## Task List

### Task 1: Run full repository validation
**Description:** Execute the root validation script to verify Rust, wasm, generated package smoke tests, and web workspace checks together.

**Acceptance criteria:**
- [ ] `./scripts/verify-local.sh` completes successfully.
- [ ] Any validation failure is fixed or documented with a concrete blocker.

**Verification:**
- [ ] `./scripts/verify-local.sh`

**Dependencies:** None

**Files likely touched:**
- Only files required to fix validation failures.

**Estimated scope:** Small to Medium

### Task 2: Document duplicate-ID rejection contract
**Description:** Add a concise spec note that `add_slot` rejects an existing `slot_id` and `add_appointment` rejects an existing `appointment_id`.

**Acceptance criteria:**
- [ ] Functional or technical spec states create commands do not overwrite existing records.
- [ ] The note is behavior-focused and does not duplicate test details.

**Verification:**
- [ ] Documentation diff reviewed manually.

**Dependencies:** Task 1

**Files likely touched:**
- `docs/functional_spec.md`
- `docs/technical_spec.md`

**Estimated scope:** Small

### Task 3: Record completion memory
**Description:** Capture the completed contract-hardening outcomes so future work does not rediscover the same decisions.

**Acceptance criteria:**
- [ ] `.agents/memory/` contains a short summary of implemented changes and validation run.
- [ ] Summary lists committed phases and any remaining follow-up.

**Verification:**
- [ ] Memory file reviewed manually.

**Dependencies:** Tasks 1 and 2

**Files likely touched:**
- `.agents/memory/core-contract-hardening.md`

**Estimated scope:** Small

### Task 4: Clean up completed plan folders
**Description:** Remove completed plan artifacts from `.agents/plans/` after the work is accepted, following repository workflow rules.

**Acceptance criteria:**
- [ ] Completed plan folders are removed only after their outcomes are captured in memory.
- [ ] Any still-active plan remains in `.agents/plans/`.

**Verification:**
- [ ] `git status --short`

**Dependencies:** Task 3

**Files likely touched:**
- `.agents/plans/core-engine-contract/**`
- `.agents/plans/core-contract-finalization/**`

**Estimated scope:** Small

## Checkpoint
- [ ] Full validation passed.
- [ ] Duplicate-ID behavior documented.
- [ ] Memory summary added.
- [ ] Plan cleanup decision made.

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Full validation exposes unrelated failures | Medium | Fix only if directly related; otherwise document blocker clearly. |
| Specs become too verbose | Low | Add one concise behavioral note near command requirements. |
| Plan artifacts are removed before outcome is recorded | Medium | Write memory summary before deleting plan folders. |

## Commit Checkpoints
- `docs: plan core contract finalization`
- `docs: document duplicate id rejection contract`
- `docs: record core contract hardening outcome`
