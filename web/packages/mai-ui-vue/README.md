# @mai/mai-ui-vue

Vue 3 calendar UI package for `mai` scheduling workflows.

This package is the Vue UI layer. App services such as auth, persistence, provider directories, notifications, payments, and deployment remain owned by the consuming application. For the full package boundary and adoption model, see `docs/frontend_adoption_guide.md` from the repository root.

## Install

```bash
pnpm add @mai/mai-ui-vue @mai/mai-web-core
```

Import styles once in your app entry:

```ts
import "@mai/mai-ui-vue/styles.css";
```

## Usage Modes

Use `MaiBoard` when you want a pure presentational week board and manage all actions yourself.

Use `MaiBoardInteractive` when you want built-in action cards and command orchestration.

Use `MaiBookingFlow` when you want a client-facing booking flow.

Board interaction highlights:
- current-time indicator line (today column only, minute-level refresh),
- blank-space click to open create-slot overlay,
- blank-space drag to preselect create-slot time range.

`MaiBoardInteractive` calendar filter contract:
- `{ mode: "all" }`
- `{ mode: "none" }`
- `{ mode: "owners", ids: string[] }`
- `{ mode: "group", ids: string[] }`

For `owners` and `group`, an empty `ids` selection is treated as "none selected" at the core query boundary.

## `MaiBoardInteractive` (recommended)

```vue
<script setup lang="ts">
import { MaiBoardInteractive } from "@mai/mai-ui-vue";

const view = {
  title: "Availability",
  subtitle: "Weekly planning",
};

const actor = {
  resourceOwnerId: "owner-42",
  createdBy: "ui-operator",
  bookAppointmentInviteeIds: ["participant-1"],
  bookAppointmentTitle: "Consultation",
  bookAppointmentCreatedBy: "ui-operator",
  cancelAppointmentBy: "ui-operator",
};

async function mutateCommand(command: unknown): Promise<boolean> {
  // send command to adapter
  return true;
}

const actions = { mutateCommand };
</script>

<template>
  <MaiBoardInteractive
    :layout="layout"
    :anchor-date="anchorDate"
    :view="view"
    :actor="actor"
    :view-filter="{ mode: 'owners', ids: ['owner-42'] }"
    :actions="actions"
    @navigate-week="navigateWeek"
    @slot-created="refreshWeek"
    @slot-rescheduled="refreshWeek"
    @slot-booked="refreshWeek"
    @slot-cancelled="refreshWeek"
    @slot-deleted="refreshWeek"
    @appointment-cancelled="refreshWeek"
    @appointment-deleted="refreshWeek"
    @interaction-error="onInteractionError"
  />
</template>
```

## `MaiBookingFlow`

`MaiBookingFlow` is the client-facing appointment booking component for apps that expose bookable resources.

Flow:
1. choose a category,
2. optionally choose a resource,
3. choose one slot from a week view,
4. sign in or sign up if needed,
5. confirm booking.

The component does not create domain records or user identity records. The consuming app supplies context, categories, resources, availability metadata, and returns an already-known `inviteeId` after auth.

Appointment titles are generated as:

```ts
`${userDisplayName} - ${reason}`
```

Minimal shape:

```vue
<script setup lang="ts">
import { MaiBookingFlow } from "@mai/mai-ui-vue";
import { createBookSlotCommand } from "@mai/mai-web-core";

const context = { contextId: "workspace-1", label: "Workspace One" };
const categories = [
  { categoryId: "category-a", label: "Category A", description: "Standard session" },
];
const resources = [
  {
    resourceId: "resource-1",
    label: "Resource One",
    categoryIds: ["category-a"],
    resourceOwnerId: "owner-1",
  },
];
const slotOwners = {
  "slot-1": {
    resourceOwnerId: "owner-1",
    resourceId: "resource-1",
    resourceLabel: "Resource One",
  },
};

async function queryLayout(payload) {
  // call `weekly_layout` through your app adapter/client
}

async function bookSlot(payload) {
  const command = createBookSlotCommand(payload);
  // send command through your app adapter/client
}

async function requestAuth() {
  return {
    inviteeId: "participant-1",
    userDisplayName: "Alex Martin",
  };
}
</script>

<template>
  <MaiBookingFlow
    :context="context"
    :categories="categories"
    :resources="resources"
    :slot-owners="slotOwners"
    :view="{ anchorDate: '2026-05-07', visibleStartMinute: 480, visibleEndMinute: 1080 }"
    :booking="{ createAppointmentId: () => crypto.randomUUID() }"
    :actions="{ queryLayout, bookSlot, requestAuth }"
  />
</template>
```

After successful booking, the component immediately requeries availability before emitting the final confirmed state.

UI implementation must comply with the repository `DESIGN.md`: monochrome-first, calm operational utility, token-based styling, compact controls, visible focus states, and no gradients or decorative graphics.

## Public API

- Components: `MaiBoard`, `MaiBoardInteractive`, `MaiBookingFlow`
- Booking components: `MaiLocationPicker`, `MaiCategoryPicker`, `MaiResourcePicker`, `MaiAvailabilityPicker`, `MaiBookingAuthGate`, `MaiBookingConfirmCard`
- Action cards: `MaiCreateSlotCard`, `MaiSlotActionsCard`, `MaiAppointmentActionsCard`
- Integration: `useMai`, `createNuxtMaiState`
- Event/interaction constants:
  - `MAI_BOARD_INTERACTIVE_EVENTS`
  - `MAI_BOOKING_FLOW_EVENTS`
  - `INTERACTION_ACTIONS`
  - `INTERACTION_SUCCESS_EVENTS`
- Types: import from `@mai/mai-ui-vue` (single stable type surface)

## Internal Structure

- `src/features/board`: presentational board feature, split into `internal/api`, `internal/model`, `internal/state`, and `internal/ui`.
- `src/features/interactive-board`: board orchestration plus domain-specific action cards.
- `src/features/booking`: client booking flow, split into `model`, `state`, and `ui`.
- `src/features/calendar-filter`: calendar filter UI.
- `src/shared`: package-internal reusable UI and shared styling foundations.

The root entrypoint remains the supported package API. Internal feature modules live under `src/features`; consumers that use non-root imports must follow the feature-first structure directly.
