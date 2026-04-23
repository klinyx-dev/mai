# TM17 Calendar Drag/Resize Interactions Status (2026-04-23)

## Outcome
- Added slot reschedule command path from core to wasm/web boundary.
- Added `MaiBoard` slot drag/resize event emission (`reschedule-slot`).
- Added `MaiBoardInteractive` reschedule orchestration:
  - callback mode: `rescheduleSlot`
  - adapter mode: `mutateCommand` + `COMMANDS.RESCHEDULE_SLOT`
  - success event: `slot-rescheduled`
- Added deterministic slot gesture math module for UI:
  - 15-minute snap
  - day/time move draft
  - top/bottom resize draft
  - clamp to day bounds and minimum duration

## Verification
- `cargo test -p mai` passed during TM17 core boundary checkpoint.
- `pnpm --filter @mai/mai-ui-vue build` passed.
- `pnpm --filter @mai/mai-ui-vue test` passed.

## Notes
- Drag/resize currently targets slot chips only (appointments unchanged).
- Horizontal day shift is represented in drop payload and command mapping; post-mutation layout refresh remains app-driven.
