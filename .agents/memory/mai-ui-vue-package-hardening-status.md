# mai-ui-vue package hardening status

Date: 2026-04-24
Status: completed

## Completed outcomes

- Formalized internal layers with explicit barrels:
  - `src/board/ui/index.ts`
  - `src/interactive/index.ts`
  - `src/integration/index.ts`
- Updated `MaiBoard` imports to use `board/ui` barrel.
- Refactored `MaiBoardInteractive` to support grouped API:
  - `view`
  - `actor`
  - `actions`
- Preserved backward compatibility for existing flat props in `MaiBoardInteractive`.
- Expanded public types for grouped interactive config:
  - `MaiBoardInteractiveViewConfig`
  - `MaiBoardInteractiveActorConfig`
  - `MaiBoardInteractiveActionConfig`
  - `MaiActionRunner`
- Kept public package exports intentional and integration-oriented in `src/index.ts`.
- Migrated Nuxt example to the grouped recommended API (`view`, `actor`, `actions`).
- Added package consumption doc:
  - `web/packages/mai-ui-vue/README.md`
- Updated workspace web docs to reflect grouped interactive configuration:
  - `web/README.md`
- Added public API contract coverage:
  - `web/packages/mai-ui-vue/tests/public-api.test.mjs`

## Verification run

- `pnpm --filter @mai/mai-ui-vue build` ✅
- `pnpm --filter @mai/mai-ui-vue test` ✅
- `pnpm --filter @mai/nuxt-app-example build` ✅
- `pnpm run test:boundary` ✅

## Notes

- New contributor default path is now: `MaiBoardInteractive` + grouped props.
- `MaiBoard` remains the low-level presentational entry point.

---

Date: 2026-04-30
Status: in-progress hardening continuation

## Completed outcomes (2026-04-30)

- Removed `MaiBoardInteractive` legacy flat-prop compatibility path and kept grouped config as the canonical API.
- Centralized `MaiBoardInteractive` public event names behind `MAI_BOARD_INTERACTIVE_EVENTS`.
- Centralized `MaiBookingFlow` public event names behind `MAI_BOOKING_FLOW_EVENTS`.
- Consolidated booking + interactive emits runtime payload checks into shared validators:
  - `src/validators/events.ts`
- Upgraded slot interactions from mouse-only to pointer events for move/resize.
- Added keyboard-accessible slot resize controls:
  - focusable handle buttons,
  - explicit ARIA labels,
  - arrow-key resize in 15-minute increments.
- Added availability announce semantics:
  - `aria-live="polite"`,
  - `aria-atomic="true"`,
  - `aria-busy` on availability region.
- Clarified mobile overflow behavior:
  - admin board scroll container explicitly handles horizontal overflow on small screens,
  - booking availability strip is explicitly horizontally scrollable on small screens.

## Verification run (2026-04-30)

- `pnpm --filter @mai/mai-ui-vue build` ✅
- `pnpm --filter @mai/mai-ui-vue test` ✅

## Commit trail (2026-04-30)

- `18007bb` refactor: centralize board interactive events
- `43a5d1c` refactor: centralize booking flow events
- `305ec05` refactor: share ui event validators
- `5733b0e` fix: support pointer interactions for board events
- `a5b2b83` fix: make board resize controls accessible
- `f3e2262` fix: announce booking availability updates
- `be67ff2` fix: clarify mobile board overflow behavior
