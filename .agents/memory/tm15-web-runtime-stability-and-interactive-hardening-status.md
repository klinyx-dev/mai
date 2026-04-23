# TM15 Web Runtime Stability and Interactive Hardening Status

Date: 2026-04-23

## Completed
- Reworked web dev startup to reduce Nuxt manifest/cache drift failures:
  - added scoped cache reset script: `web/scripts/reset-nuxt-dev-cache.mjs`,
  - updated `web/package.json` `example:dev` to run cache reset before `nuxt dev`.
- Constrained Nuxt toolchain drift:
  - pinned `examples/nuxt-app` `nuxt` dependency to `3.21.2`,
  - added `pnpm` override for `@nuxt/cli` to `3.21.1` in `web/package.json`.
- Added adapter-mode command mapping extraction for `MaiBoardInteractive`:
  - `web/packages/mai-ui-vue/src/interactive/command-mode.ts`.
- Added dedicated tests validating typed command envelope mapping for adapter mode:
  - `web/packages/mai-ui-vue/tests/interactive-command-mode.test.mjs`.
- Updated docs:
  - `web/README.md` troubleshooting for `#app-manifest`,
  - `docs/technical_spec.md` TM15 runtime stability note.

## Verification
- `pnpm --filter @mai/mai-ui-vue build`
- `pnpm --filter @mai/mai-ui-vue test`
- `pnpm --filter @mai/nuxt-app-example build`
- `pnpm run test` (web workspace)

## Notes
- `pnpm --filter @mai/nuxt-app-example dev` is a long-running command and was validated through startup hardening + build/test path rather than a full persistent terminal session in automation.
