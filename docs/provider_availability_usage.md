# Provider Availability Usage

Use `MaiBoardInteractive` for provider/admin availability workflows.

Do not use `MaiBookingFlow` for slot administration.

## Import

```ts
import "@mai/mai-ui-vue/styles.css";
import {
  MaiBoardInteractive,
  type MaiBoardMode,
  type MaiBoardInteractiveActorConfig,
  type MaiBoardInteractiveActionConfig,
  type MaiViewFilter,
} from "@mai/mai-ui-vue";
```

## Required Inputs

1. `layout`
- weekly semantic layout response.

2. `anchorDate`
- week anchor date string (`YYYY-MM-DD`).

3. `actor`
- provider/admin actor context.

4. `actions`
- command handlers or `mutateCommand` bridge.

## Recommended Configuration

Provider/admin mode:

```ts
const mode: MaiBoardMode = "provider-admin";
```

Actor config should include:
- `resourceOwnerId`
- `createdBy`
- `defaultSlotDurationMinutes`
- appointment-booking defaults if booking from board is enabled.

Actions can be implemented either as:
1. explicit handlers (`createSlot`, `rescheduleSlot`, etc), or
2. `mutateCommand` that accepts `AnyCommandEnvelope`.

## Command Handling Pattern

1. user interaction emits action payload.
2. action handler sends mutation to backend/core adapter.
3. on success, refresh weekly layout query.
4. on failure, return `false` or throw.
5. board emits `interaction-error` and keeps selection open on failure.

## Visibility and Permissions

Use `visibleActions` to align UI affordances with app permissions.

Example policy:
- receptionist: create/reschedule/cancel slots, no appointment delete.
- provider: full provider-admin actions.
- support/debug: `debug-admin`.

Always enforce permission checks server-side.

## Filter and Window Integration

Combine board with:
- `MaiCalendarFilterToolbar`
- `view_filter` payload
- visible-hour window query options

This allows owner-scoped availability and deterministic clipping.

## Example Integration

Reference provider/admin example:
- `web/examples/nuxt-app/pages/index.vue`

Reference client booking example:
- `web/examples/nuxt-app/pages/resources/[contextId]/book.vue`
