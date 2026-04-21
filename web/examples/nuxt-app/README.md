# Nuxt example app

This is a runnable Nuxt integration example for `@mai/mai-ui-vue`.

## What it demonstrates
- client-only wasm initialization from `core/pkg/mai.js`
- adapter injection through Nuxt plugin (`$mai`)
- week calendar rendering via `MaiBoard`
- week navigation (`Prev`, `Today`, `Next`) with query refresh per week anchor

## Key files
- `plugins/mai.client.ts`:
  initializes wasm and provides `createNuxtMaiState(adapter)`.
- `pages/index.vue`:
  owns `anchorDate` state, calls `useMai().refresh(...)`, and binds to `MaiBoard`.
- `nuxt.config.ts`:
  includes `compatibilityDate` and Vite fs allow-list for `../../../core/pkg`.

## Run
From `web/`:

```bash
pnpm run example:dev
```

## Integration notes
- Keep wasm/plugin usage inside client context.
- Keep adapter and API calls in page/composable layer, not inside pure presentational components.
