# mai web workspace

Nuxt-first workspace for consuming the Rust/wasm scheduling core in web apps.

## Workspace structure
- `packages/mai-web-core`:
  framework-agnostic TypeScript contracts and JSON adapter helpers for command/query calls.
- `packages/mai-ui-vue`:
  Vue 3 UI package built on top of `mai-web-core` (current primary component is `MaiBoard` week calendar view).
- `examples/nuxt-app`:
  runnable integration example using `WasmBindgenAdapter` from `core/pkg`.

## Package boundaries
- `mai-web-core` owns data contracts and transport helpers.
- `mai-ui-vue` owns presentation and user interaction patterns.
- The example app owns app state (selected week, refresh triggers, adapter initialization).

## Prerequisites
- Node.js 22.x recommended (Node 23 may show experimental warnings from transitive deps).
- pnpm 10.x.

## Install and build
```bash
cd web
pnpm install
pnpm run build
```

## Run example app
```bash
cd web
pnpm run example:dev
```

Default URL: `http://localhost:3000/`

If `3000` is taken:
```bash
pnpm --filter @mai/nuxt-app-example dev --host 127.0.0.1 --port 3101
```

## Commands
- `pnpm run build`:
  builds `@mai/mai-web-core` then `@mai/mai-ui-vue`.
- `pnpm run test`:
  runs tests for `@mai/mai-web-core`.
- `pnpm run example:dev`:
  runs Nuxt example development server.

## Common issues
- `Unsupported URL Type "workspace:*"`:
  run with `pnpm` (not `npm`).
- Vite fs-allow error for wasm (`mai_bg.wasm` outside allow list):
  check `examples/nuxt-app/nuxt.config.ts` includes `../../../core/pkg` in `vite.server.fs.allow`.
