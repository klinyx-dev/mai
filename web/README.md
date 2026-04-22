# mai web workspace

Nuxt-first workspace for consuming the Rust/wasm scheduling core in web apps.

## Workspace structure
- `packages/mai-web-core`:
  framework-agnostic TypeScript contracts and JSON adapter helpers for command/query calls.
- `packages/mai-wasm-adapter`:
  wasm runtime bootstrap package that hides direct `core/pkg` usage behind a stable adapter factory.
- `packages/mai-ui-vue`:
  Vue 3 UI package built on top of `mai-web-core` (current primary component is `MaiBoard` week calendar view).
- `examples/nuxt-app`:
  runnable integration example consuming package APIs.

## Package boundaries
- `mai-web-core` owns data contracts and transport helpers.
- `mai-wasm-adapter` owns wasm-bindgen runtime initialization and adapter creation.
- `mai-ui-vue` owns presentation and user interaction patterns.
- The example app owns app state (selected week, refresh triggers) and composes package-level adapters only.

Boundary rule:
- App code should not import `core/pkg/*` directly.
- App code should import runtime adapter APIs from package exports.

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
  builds `@mai/mai-web-core`, `@mai/mai-wasm-adapter`, and `@mai/mai-ui-vue`.
- `pnpm run test`:
  runs workspace build, package tests, and boundary smoke checks.
- `pnpm run test:boundary`:
  fails if app source imports `core/pkg` directly.
- `pnpm run example:dev`:
  runs Nuxt example development server.

## Migration notes
Old app-level wiring (avoid):
```ts
import init, { WasmBindgenAdapter } from "../../../../core/pkg/mai.js";

await init();
const adapter = new WasmBindgenAdapter();
```

New package-first wiring (recommended):
```ts
import { createWasmAdapter } from "@mai/mai-wasm-adapter";

const adapter = await createWasmAdapter();
```

## Common issues
- `Unsupported URL Type "workspace:*"`:
  run with `pnpm` (not `npm`).
- `IPC connection closed` / unstable Nuxt dev startup:
  use Node.js `22.x` (Node `25.x` is not supported in this workspace).
- Vite fs-allow error for wasm (`mai_bg.wasm` outside allow list):
  check `examples/nuxt-app/nuxt.config.ts` includes `../../../core/pkg` in `vite.server.fs.allow`.
