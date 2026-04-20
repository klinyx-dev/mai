# Changelog

## [0.1.0] - 2026-04-20
### Added
- Phase 1 headless scheduling core with typed domain models, command APIs, deterministic validation, and weekly layout projection.
- Stable JSON adapter boundary with command/query envelopes and shared success/error response envelopes.
- `wasm-bindgen` export wrapper (`WasmBindgenAdapter`) with JSON-only entrypoints.
- Generated-package JS smoke validation for `wasm-pack` output consumption.
- CI workflow with Rust quality checks and wasm package smoke verification.
- ADR-001 locking near-term core technical decisions.

### Changed
- Technical specification now marks TM6c complete and converts open technical decisions into accepted locked decisions.
- Functional specification clarifies Phase 1 actor reference handling as opaque IDs (no core actor-registry validation).
- Dev workflows include `cargo make wasm-smoke` as part of full CI parity checks.

### Fixed
- Clippy compliance for adapter constructor pattern via `Default` implementation on `WasmBindgenAdapter`.
