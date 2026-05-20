# Core Contract Hardening Outcome (2026-05-20)

## Scope completed
- Ran full repository validation via `./scripts/verify-local.sh` (pass).
- Hardened core command contract to reject duplicate create IDs deterministically:
  - duplicate `slot_id` -> reject,
  - duplicate `appointment_id` -> reject.
- Added/expanded atomicity coverage for rejected command flows.
- Added end-to-end coverage for owner filter modes and visible-window clipping behavior.
- Added wasm adapter parity coverage for:
  - duplicate slot/appointment ID error mapping,
  - visible-window clipping response semantics.

## Contract decisions locked
1. Create commands do not overwrite existing records.
2. Rejected commands must not partially mutate schedule state.
3. Owner-filter and visible-window query semantics are deterministic in both core and wasm boundary.

## Documentation updates
- `docs/functional_spec.md` now explicitly states duplicate-ID rejection for create commands.
- `docs/technical_spec.md` was refined to a shorter architecture-first version focused on:
  - product mental model,
  - core boundaries,
  - command/query contracts,
  - invariants and error behavior,
  - adapter boundary contract.

## Commit trail (this cycle)
- `fix: reject duplicate ids and harden core contract`
- `test: assert state atomicity on rejected commands`
- `test: expand e2e coverage for owner filters and visible window`
- `test: add wasm parity coverage for duplicate ids and clipping`
- `docs: plan core contract finalization`
- `docs: add technical spec refinement to finalization plan`

## Follow-up candidates
- Publish a short adapter error-code reference table for external consumers.
- Keep technical and functional specs aligned whenever command/query contracts change.
