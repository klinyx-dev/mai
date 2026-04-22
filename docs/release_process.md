# Release Process

This project releases from `main`.

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
- GitHub Actions CI is green on `main`:
  - `rust-quality`
  - `wasm-package-smoke`

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
