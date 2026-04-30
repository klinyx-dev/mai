# mai

Headless scheduling core in Rust with wasm + web integration.

## Repository structure
- `core/`: Rust scheduling core crate.
- `web/`: web workspace (`mai-web-core`, `mai-ui-vue`, Nuxt example app).
- `docs/`: functional/technical specs and adapter usage docs.

## Prerequisites
- Rust stable (`rustup`, `cargo`)
- Rust target `wasm32-unknown-unknown`
- `wasm-pack`
- Node.js 22.x
- `pnpm` 10.x

## Quick start (local)
From repository root:

```bash
rustup target add wasm32-unknown-unknown

cd core
wasm-pack build --target web --out-dir pkg --out-name mai
cd ..

cd web
pnpm install
pnpm run build
pnpm run example:dev
```

Open `http://localhost:3000/`.

## Validation commands
From repository root:

```bash
./scripts/verify-local.sh
```

Equivalent manual sequence:

```bash
cargo fmt --all --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test
cargo check --target wasm32-unknown-unknown -p mai
core/tests/run_generated_package_smoke.sh
cd web && pnpm run build && pnpm run test
```

## Useful docs
- Dev setup details: [README-dev.md](./README-dev.md)
- Web workspace guide: [web/README.md](./web/README.md)
- Release process: [docs/release_process.md](./docs/release_process.md)
- Wasm adapter usage: [docs/wasm_adapter_usage.md](./docs/wasm_adapter_usage.md)
- Payload examples: [docs/adapter_payload_examples.md](./docs/adapter_payload_examples.md)

## Core engine usage (Rust)

```rust
use chrono::{NaiveDate, TimeZone, Utc};
use mai::{ActorId, AddSlotCommand, SchedulerService, SlotId, WeeklyLayoutQuery};

let mut service = SchedulerService::new();
service.add_slot(AddSlotCommand {
    slot_id: SlotId::new("slot-1"),
    start: Utc.with_ymd_and_hms(2026, 5, 4, 9, 0, 0).unwrap(),
    end: Utc.with_ymd_and_hms(2026, 5, 4, 9, 30, 0).unwrap(),
    resource_owner_id: ActorId::new("owner-1"),
    created_by: ActorId::new("admin-1"),
})?;

let layout = service.get_weekly_layout_checked(
    WeeklyLayoutQuery::new(NaiveDate::from_ymd_opt(2026, 5, 7).unwrap())
)?;
assert_eq!(layout.week_start, NaiveDate::from_ymd_opt(2026, 5, 4).unwrap());
# Ok::<(), mai::SchedulerError>(())
```

Use `get_weekly_layout_checked` for user-provided query inputs; it returns structural errors instead of panicking on invalid visible windows.
