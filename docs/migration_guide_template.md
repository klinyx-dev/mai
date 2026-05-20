# Migration Guide Template

Use this template for any release with breaking changes.

## Summary

- From version: `vX.Y.Z`
- To version: `vA.B.C`
- Impacted packages:
  - `mai`
  - `@mai/mai-web-core`
  - `@mai/mai-wasm-adapter`
  - `@mai/mai-ui-vue`

## Breaking Changes

1. `Change title`
- What changed:
- Why:
- Who is affected:

## Required Code Updates

1. `Area`
- Before:
```ts
// old code
```
- After:
```ts
// new code
```

## Payload/Envelope Updates

- Commands:
- Queries:
- Errors:
- Legacy envelope compatibility retained (Yes/No):
- If `No`, list each changed field/semantic and reason:

## Behavior Changes

- Default behavior changes:
- Validation changes:
- UI event/prop changes:
- Legacy fixed-slot behavior changed (Yes/No):
- If `Yes`, include rollback-safe transition strategy:

## Compatibility Matrix (Required)

Fill this table for every advanced scheduling release:

| Contract Surface | Legacy behavior (unchanged) | New additive behavior | Breaking behavior |
|---|---|---|---|
| Rust commands/queries |  |  |  |
| wasm JSON command/query payloads |  |  |  |
| wasm error envelope/category/code |  |  |  |
| `@mai/mai-web-core` exports |  |  |  |
| `@mai/mai-wasm-adapter` exports |  |  |  |
| `@mai/mai-ui-vue` props/emits/events |  |  |  |

Rules:
- Leave breaking behavior empty unless this is a major release.
- If any breaking behavior exists, include a concrete before/after example in this guide.

## Test and Verification Steps

From repository root:

```bash
cargo test
cargo check --target wasm32-unknown-unknown -p mai
cd web
pnpm run build
pnpm run test
```

## Rollback / Fallback

- Recommended rollback strategy:
- Temporary compatibility shim (if any):

## References

- Changelog entry:
- Updated spec/docs:
- PR links:
