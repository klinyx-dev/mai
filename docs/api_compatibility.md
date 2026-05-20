# API Compatibility Policy

This policy defines semantic versioning for the public API described in `docs/public_api_inventory.md`.

Version scope covered:
- Rust crate: `mai`
- wasm JSON envelope boundary
- TypeScript packages:
  - `@mai/mai-web-core`
  - `@mai/mai-wasm-adapter`
  - `@mai/mai-ui-vue`

## Rules

1. Patch (`x.y.Z`)
- bug fixes and internal refactors with no public API change.
- docs clarifications that do not change behavior.
- performance changes with identical observable contract.

2. Minor (`x.Y.0`)
- backward-compatible new public features.
- additive command/query fields where omitted behavior remains unchanged.
- additive TypeScript exports and additive Vue props/events with safe defaults.
- additive error codes only when existing codes and categories remain stable.

3. Major (`X.0.0`)
- any breaking change to public API or behavior.
- renamed/removed/retagged command/query names.
- changed envelope shape.
- removed/renamed TypeScript/Vue exports.
- changed meaning of existing error codes.
- changed default behavior in a way that breaks existing callers.

## Rust Compatibility

Patch/minor allowed:
- add internal modules not publicly re-exported.
- additive methods/types that do not alter existing semantics.

Major required:
- remove or rename exported `pub use` symbols in `core/src/lib.rs`.
- change command/query struct field names or serde behavior in a breaking way.
- change error enum variants exposed to consumers.

## Wasm JSON Compatibility

Patch/minor allowed:
- additive optional payload fields.
- additive command/query variants only if existing variants are unchanged.
- additive response fields only when existing fields remain valid and unchanged.

Major required:
- changing `{"command":"...","payload":...}` or `{"query":"...","payload":...}` shape.
- changing `{"status":"success","data":...}` or `{"status":"error","error":...}` shape.
- renaming/removing existing command/query tags.
- changing error `category` or existing `code` values.

## TypeScript Package Compatibility

Patch/minor allowed:
- additive exports.
- additive optional properties with backward-compatible defaults.
- stricter runtime validation with same public signatures.

Major required:
- removing/renaming exported runtime functions.
- removing/renaming exported types used by consumers.
- narrowing accepted public inputs in a way that rejects previously valid usage.

## Vue UI Compatibility

Patch/minor allowed:
- additive optional props/events.
- visual changes that preserve documented behavior and event payloads.

Major required:
- removing/renaming components, props, emits, or exported event constants.
- changing emitted payload shape for existing events.
- changing default behavior that breaks current integrations.

## Error Code Stability

`error.code` is stable contract. `error.message` is informational.

Patch/minor allowed:
- clearer message text with same `category` and `code`.
- additive codes for new features.

Major required:
- changing or removing existing codes.
- moving an existing code to a different category.

## Compatibility Workflow

Before merge:
1. classify change as patch/minor/major.
2. verify against this policy.
3. update `CHANGELOG.md`.
4. update docs and payload examples if contract changed.
5. update tests:
   - `core/tests/serialization_contract.rs`
   - web package export/boundary tests.

For major changes:
1. publish migration note using `docs/migration_guide_template.md`.
2. update `docs/release_process.md`.
3. include explicit breaking-change section in release notes.
