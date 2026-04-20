# mai

mai is a scheduler library.

## Workspace
- `core/`: Rust headless scheduling core crate.
- `docs/adapter_payload_examples.md`: adapter-facing JSON payload examples.

## Stable DTO Boundary
Import public DTOs from the crate root (example: `mai::AddSlotCommand`, `mai::WeeklyLayoutQuery`, `mai::WeeklyLayout`, `mai::SchedulerError`) to avoid relying on internal module paths.

## Commands
From the repository root:

```bash
cargo build
cargo test
cargo fmt --all --check
cargo clippy --all-targets --all-features -- -D warnings
```
