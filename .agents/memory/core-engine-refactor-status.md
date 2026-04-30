# Core Engine Refactor Status

Date: 2026-04-30

Completed:
- extracted explicit business policies (`application/policies`) for overlap and appointment cancellation/uniqueness rules.
- normalized actor-reference validation with explicit role errors (`InviteeNotFound`, `UpdaterNotFound`, `CancellerNotFound`) and enforced invitee/canceller checks when actor lookup is configured.
- resolved weekly layout queries into validated query objects and introduced reusable `CalendarOwnerFilter` in `layout/query_filter.rs`.
- decoupled WASM command wire payload DTOs from core command DTOs while preserving JSON contract.
- tightened crate boundary by making `state`/`validation` internal modules and keeping stable re-exports.
- added property-based tests for overlap symmetry/edge-adjacency and `TimeRange` duration invariants.
- removed placeholder state modules and updated architecture/usage documentation.

Validation:
- `cargo fmt --all`
- `cargo test`
- `cargo clippy --all-targets --all-features -- -D warnings`
