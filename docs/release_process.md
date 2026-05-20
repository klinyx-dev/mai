# Release Process

This project releases from `main`.

Compatibility policy references:
- `docs/public_api_inventory.md`
- `docs/api_compatibility.md`
- `docs/compatibility_matrix.md`
- `docs/migration_guide_template.md`

## Branch and tag policy
- Merge the release PR into `main` first.
- Create version tags from commits already on `main`.
- Use semantic version tags (example: `v0.1.2`).

## Pre-release checklist
From repository root:

```bash
./scripts/verify-local.sh
```

This covers:
- Rust format/lint/tests
- wasm target check
- generated wasm package smoke validation
- web workspace build/tests

Also verify:
- `CHANGELOG.md` has the new version entry.
- API docs are current when public contract changed:
  - `docs/adapter_payload_examples.md`
  - `docs/adapter_error_codes.md`
  - `docs/public_api_inventory.md`
- GitHub Actions CI is green on `main`:
  - `rust-quality`
  - `wasm-package-smoke`

For breaking releases:
- include migration notes using `docs/migration_guide_template.md`.

## Phase 5 advanced scheduling release gate

For any release introducing advanced scheduling capabilities (recurrence, batch slot ops, capacity, blackout periods, metadata):

1. Confirm scope is covered by:
   - `docs/advanced_scheduling_spec.md`
   - `docs/functional_spec.md`
   - `docs/technical_spec.md`
2. Publish an explicit compatibility map in the release notes:
   - unchanged legacy contracts,
   - new additive contracts,
   - intentionally breaking contracts (major only).
3. Verify public payload/error docs include new contracts without silently changing legacy envelopes:
   - `docs/adapter_payload_examples.md`
   - `docs/adapter_error_codes.md`
4. Verify tests cover both:
   - legacy fixed-slot behavior,
   - new advanced-capability behavior.
5. If any existing envelope field semantics changed, require:
   - major version bump,
   - migration guide sections for Rust, wasm JSON, TypeScript exports, and Vue events/props.

## Tag and publish
From a clean local `main`:

```bash
git checkout main
git pull
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin vX.Y.Z
```

Then create the GitHub Release for `vX.Y.Z` and use the changelog entry as release notes.

## Rollback note
If a bad tag is created, do not reuse the same version number. Create a follow-up patch release (for example, `v0.1.3`) with fixes.
