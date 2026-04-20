# mai

mai is a scheduler library.

## Workspace
- `core/`: Rust headless scheduling core crate.
- `docs/adapter_payload_examples.md`: adapter-facing JSON payload examples.
- `docs/wasm_adapter_usage.md`: end-to-end WASM adapter usage notes (JSON command/query flow).

## Stable DTO Boundary
Import public DTOs from the crate root (example: `mai::AddSlotCommand`, `mai::WeeklyLayoutQuery`, `mai::WeeklyLayout`, `mai::SchedulerError`) to avoid relying on internal module paths.

## Quick Start
```rust
use chrono::NaiveDate;
use mai::{AddSlotCommand, ActorId, SchedulerService, SlotId, WeeklyLayoutQuery};

let mut service = SchedulerService::new();
service.add_slot(AddSlotCommand {
    slot_id: SlotId::new("slot-1"),
    start: "2026-05-04T09:00:00Z".parse().unwrap(),
    end: "2026-05-04T09:30:00Z".parse().unwrap(),
    assignee_id: ActorId::new("doctor-42"),
    created_by: ActorId::new("admin-7"),
})?;

let layout = service.get_weekly_layout(WeeklyLayoutQuery {
    anchor_date: NaiveDate::from_ymd_opt(2026, 5, 7).unwrap(),
});
assert_eq!(layout.week_start.to_string(), "2026-05-04");
# Ok::<(), mai::SchedulerError>(())
```

## Architecture Summary
- `domain`: typed entities and value objects
- `commands`: mutation request DTOs
- `validation`: deterministic business rule checks
- `application`: `SchedulerService` orchestration boundary
- `layout`: weekly semantic projection (no pixel/UI logic)
- `adapters`: integration surface (WASM-ready boundary)

## Extend The Crate
1. Add/adjust command DTOs under `core/src/commands/`.
2. Add pure rules under `core/src/validation/`.
3. Keep orchestration in `core/src/application/scheduler_service.rs`.
4. Add unit tests in module files plus integration tests in `core/tests/`.
5. Add adapter payload examples in `docs/adapter_payload_examples.md` when DTO shape changes.

## Commands
From the repository root:

```bash
cargo build
cargo test
cargo fmt --all --check
cargo clippy --all-targets --all-features -- -D warnings
```
