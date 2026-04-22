# MaiBoard refactor status (clean architecture)

Date: 2026-04-22

## Summary
- Refactored `web/packages/mai-ui-vue/src/MaiBoard.tsx` from monolithic component to orchestration-focused composition.
- Preserved existing public `MaiBoard` props and emitted events.
- Improved maintainability by splitting concerns into dedicated modules.

## Implemented changes
- Added `web/packages/mai-ui-vue/src/board/contract.ts`
  - Owns runtime prop validators and emit validators for `MaiBoard`.
  - Exposes `MaiBoardProps` and `MaiBoardEmit` typing helpers.
- Added `web/packages/mai-ui-vue/src/board/controller.ts`
  - Owns board computed state, selection state, click handlers, and action emit+clear flows.
- Added `web/packages/mai-ui-vue/src/board/MaiActionOverlay.tsx`
  - Owns popover positioning and conditional rendering for create-slot / slot-actions / appointment-actions overlays.
- Replaced `web/packages/mai-ui-vue/src/MaiBoard.tsx`
  - Now composes `MaiWeekHeader`, `MaiTimeGutter`, `MaiDayColumn`, and `MaiActionOverlay`.

## Validation
- `pnpm --filter @mai/mai-ui-vue build` ✅
- `pnpm --filter @mai/mai-ui-vue test` ✅
- `pnpm --filter @mai/nuxt-app-example build` ✅

## Notes
- No public API break introduced for `MaiBoard`.
- Refactor is internal-architecture focused and ready for follow-up incremental improvements (for example: optional grouped props facade, stricter runtime/date validation boundaries, and targeted component tests for overlay behavior).
