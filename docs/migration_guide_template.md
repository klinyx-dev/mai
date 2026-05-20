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

## Behavior Changes

- Default behavior changes:
- Validation changes:
- UI event/prop changes:

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
