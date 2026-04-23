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

## UI board contract (TM11/TM14)
`MaiBoard` exposes view/interaction contract fields for real app integration:
- Props:
  - `visibleStartMinute?: number` (default `0`)
  - `visibleEndMinute?: number` (default `1440`)
  - `timeLabelFormat?: "24h" | "12h"` (default `"24h"`)
  - `emptyStateText?: string`
- Events:
  - `navigate-week`
  - `slot-click`
  - `appointment-click`
  - `empty-cell-click`

Example consumption:
```vue
<MaiBoard
  :layout="layout"
  :anchor-date="anchorDate"
  :visible-start-minute="0"
  :visible-end-minute="1440"
  time-label-format="24h"
  @navigate-week="navigateWeek"
  @slot-click="onSlotClick"
  @appointment-click="onAppointmentClick"
  @empty-cell-click="onEmptyCellClick"
/>
```

UI package tests now cover:
- full-day timeline defaults and window normalization,
- 12h/24h label formatting,
- interaction payload mapping for slot/appointment/empty-cell events.

`MaiBoardInteractive` is the recommended app-facing component when you want built-in action cards/popovers and mutation orchestration without page-level wiring.

- It composes `MaiBoard`, `MaiCreateSlotCard`, `MaiSlotActionsCard`, and `MaiAppointmentActionsCard`.
- It supports two action modes:
  - callback mode (`createSlot`, `bookSlot`, `cancelSlot`, etc.)
  - adapter mode (`mutateCommand`) that builds typed commands with `COMMANDS + createCommandEnvelope`.
- It emits high-level outcome events:
  - `slot-created`, `slot-booked`, `slot-cancelled`, `slot-deleted`
  - `appointment-cancelled`, `appointment-deleted`
  - `interaction-error`
- Empty-cell behavior:
  - click blank cell to open create-slot card,
  - click the same blank cell again to close it,
  - click another blank cell to retarget the current draft.
- Create-slot card supports editable start/end times; emitted payload is normalized deterministically when the edited range is invalid.

Example consumption:
```vue
<MaiBoardInteractive
  :layout="layout"
  :anchor-date="anchorDate"
  :assignee-id="assigneeId"
  created-by="ui-operator"
  :mutate-command="mutateCommand"
  :book-appointment-invitee-ids="['patient-demo']"
  book-appointment-title="Consultation"
  book-appointment-created-by="ui-operator"
  cancel-appointment-by="ui-operator"
  @slot-created="onSlotCreated"
  @slot-booked="onSlotBooked"
  @slot-cancelled="onSlotCancelled"
  @slot-deleted="onSlotDeleted"
  @appointment-cancelled="onAppointmentCancelled"
  @appointment-deleted="onAppointmentDeleted"
  @interaction-error="onInteractionError"
/>
```

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

`example:dev` now performs a scoped Nuxt cache reset (`examples/nuxt-app/.nuxt`, `.output`, and `node_modules/.vite`) before startup to avoid stale manifest/cache startup failures.

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

## Recommended command execution pattern
For robust app-side mutation calls, prefer constants + envelope builders from `@mai/mai-web-core`:

```ts
import { COMMANDS, createCommandEnvelope } from "@mai/mai-web-core";

const command = createCommandEnvelope(COMMANDS.CANCEL_APPOINTMENT, {
  appointment_id: "appt-1",
  cancelled_by: "ui-operator",
});

const ok = await mai.mutate(command);
```

Why:
- centralized command names reduce string drift;
- payload shape is inferred from command constant;
- adapter JSON envelope remains unchanged.

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
- `Failed to resolve import "#app-manifest"` during `nuxt dev`:
  run `pnpm run example:dev` from `web/` (this now auto-resets Nuxt caches before startup). If you run `nuxt dev` directly and hit this, execute `node ./scripts/reset-nuxt-dev-cache.mjs` from `web/`, then retry.
- Vite fs-allow error for wasm (`mai_bg.wasm` outside allow list):
  check `examples/nuxt-app/nuxt.config.ts` includes `../../../core/pkg` in `vite.server.fs.allow`.
