# TM13 Web Core Typed Command Contract Status

Date: 2026-04-23

## Completed
- Added centralized command/query constants and derived literal types in `@mai/mai-web-core`.
- Added explicit command payload interfaces and `CommandPayloadMap` / `QueryPayloadMap`.
- Added typed envelope forms for command/query contracts.
- Updated helper APIs so `createCommandEnvelope` and `createQueryEnvelope` infer payload type from command/query constant.
- Added typed-first `executeCommand` overload while preserving compatibility overload.
- Migrated app-facing mutation paths in Nuxt example to `COMMANDS + createCommandEnvelope`.
- Updated `mai-ui-vue` `useMai.mutate` to typed command envelope input.
- Expanded `mai-web-core` tests for:
  - command envelope creation,
  - query envelope creation,
  - cancel appointment command coverage.
- Updated docs with recommended typed command execution pattern.

## Verification
- `pnpm --filter @mai/mai-web-core build`
- `pnpm --filter @mai/mai-web-core test`
- `pnpm --filter @mai/mai-ui-vue build`
- `pnpm --filter @mai/mai-ui-vue test`
- `pnpm --filter @mai/nuxt-app-example build`
- `pnpm run test` (workspace)

## Notes
- Earlier `mai-ui-vue` test failures were due build/test race (parallel invocation). Running build before test resolves the issue.
