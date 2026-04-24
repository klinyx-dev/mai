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
