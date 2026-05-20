# Adapter Error Code Contract Outcome (2026-05-20)

## Scope completed
- Audited adapter-visible error enums and wasm error mapping.
- Added public reference doc: `docs/adapter_error_codes.md`.
- Linked reference from:
  - `README.md`
  - `docs/wasm_adapter_usage.md`
- Expanded wasm serialization contract coverage to assert all mapped codes:
  - all `StructuralError` variants,
  - all `ReferentialError` variants,
  - all `BusinessRuleError` variants,
  - existing contract-level adapter errors (`invalid_json`, `invalid_timezone`).

## Contract guidance locked
1. Consumers should branch on `error.code`.
2. `error.message` is human-readable and not a stable branching key.
3. `category + code` is the stable adapter failure contract.

## Validation run
- `cargo test serialization_contract` (pass)
- `cargo test` in `core/` (pass)
- `./scripts/verify-local.sh` (pass)

## Files changed
- `docs/adapter_error_codes.md`
- `README.md`
- `docs/wasm_adapter_usage.md`
- `core/tests/serialization_contract.rs`

## Follow-up
- Keep `docs/adapter_error_codes.md` updated whenever new `SchedulerError` variants or adapter contract codes are introduced.
