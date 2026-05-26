# Frontend Adoption Guide

`mai` is a frontend scheduling toolkit. It provides scheduling logic, wasm execution, TypeScript contracts, Vue UI components, and integration helpers. Consuming applications keep ownership of auth, persistence, provider records, APIs, notifications, payments, and deployment.

## Package Roles

Use the packages by responsibility:

- `@mai/mai-web-core`: framework-agnostic TypeScript contracts, command/query helpers, and the `createMaiClient` wrapper.
- `@mai/mai-wasm-adapter`: browser-side wasm loader that returns a `JsonAdapter`.
- `@mai/mai-ui-vue`: Vue components, composables, Nuxt helper state, and styles.

Application code should import from package root entrypoints only:

```ts
import { createMaiClient } from "@mai/mai-web-core";
import { createWasmAdapter } from "@mai/mai-wasm-adapter";
import { MaiBookingFlow } from "@mai/mai-ui-vue";
import "@mai/mai-ui-vue/styles.css";
```

Do not import generated wasm files, `core/pkg/*`, `dist/*`, `src/*`, or feature-internal package paths from an app.

## Framework-Agnostic Usage

Use `createMaiClient` when an app wants the scheduling engine without Vue components:

```ts
import { createMaiClient } from "@mai/mai-web-core";
import { createWasmAdapter } from "@mai/mai-wasm-adapter";

const adapter = await createWasmAdapter();
const mai = createMaiClient(adapter);

const availability = mai.queryWeeklyLayout({
  anchor_date: "2026-05-07",
  timezone: "Europe/Paris",
  view_filter: { mode: "owners", ids: ["owner-1"] },
});

const booked = mai.bookSlot({
  appointmentId: crypto.randomUUID(),
  slotId: "slot-1",
  inviteeId: "user-1",
  createdBy: "user-1",
  userDisplayName: "Alex Martin",
  reason: "Consultation",
});
```

Both methods return the stable wasm response envelope:

```ts
type Result<T> =
  | { status: "success"; data: T }
  | { status: "error"; error: { category: string; code: string; message: string } };
```

## Vue and Nuxt Usage

Import styles once:

```ts
import "@mai/mai-ui-vue/styles.css";
```

For Nuxt, create a client plugin that wires the wasm adapter into Vue-facing state:

```ts
import { createNuxtMaiState } from "@mai/mai-ui-vue";
import { createWasmAdapter } from "@mai/mai-wasm-adapter";

export default defineNuxtPlugin(async () => {
  const adapter = await createWasmAdapter();

  return {
    provide: {
      mai: createNuxtMaiState(adapter),
    },
  };
});
```

Use `MaiBookingFlow` for client-facing appointment booking and `MaiBoardInteractive` for provider/admin availability work. Booking flow users can browse availability before auth, but the consuming app must provide identity before confirmation.

## Bring Your Own App Services

`mai` deliberately does not provide:

- user authentication,
- database schemas or persistence,
- provider or location directories,
- REST or GraphQL APIs,
- notification, reminder, or payment services.

Apps map their own records into `mai` IDs and payloads at the frontend boundary. Permission checks and data persistence must still be enforced by the consuming application.

## Adoption Checklist

- Install the package set used by your app.
- Build or load the wasm package through `@mai/mai-wasm-adapter`.
- Use `@mai/mai-web-core` for commands, queries, and direct engine usage.
- Use `@mai/mai-ui-vue` for Vue components and composables.
- Keep imports on documented package entrypoints.
- Handle `status: "error"` envelopes and surface `error.code` for diagnostics.
- Refresh weekly layout after successful mutations.
