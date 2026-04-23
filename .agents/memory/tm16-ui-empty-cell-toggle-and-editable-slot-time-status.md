# TM16 UI Empty-Cell Toggle and Editable Slot Time Status

Date: 2026-04-23

## Completed
- Added empty-cell toggle interaction behavior:
  - first click opens create-slot card,
  - second click on same cell closes the card,
  - click on different cell retargets the draft.
- Added editable start/end time controls in `MaiCreateSlotCard` (minute precision).
- Added deterministic time boundary helpers in action payload module:
  - parse/format minute-of-day labels,
  - normalize invalid slot ranges,
  - build create-slot payload from explicit start/end range.
- Kept `MaiBoardInteractive` integration surface stable for consumers.

## Tests
- Extended UI tests for:
  - empty-cell toggle and retarget behavior,
  - time parse/format utilities,
  - invalid range normalization and payload determinism.

## Verification
- `pnpm --filter @mai/mai-ui-vue build`
- `pnpm --filter @mai/mai-ui-vue test`
- `pnpm --filter @mai/nuxt-app-example build`
- `pnpm run test` (web workspace)
