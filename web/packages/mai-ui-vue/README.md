# @mai/mai-ui-vue

Vue 3 calendar UI package for `mai` scheduling workflows.

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
  bookAppointmentInviteeIds: ["patient-1"],
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

## Public API

- Components: `MaiBoard`, `MaiBoardInteractive`
- Action cards: `MaiCreateSlotCard`, `MaiSlotActionsCard`, `MaiAppointmentActionsCard`
- Integration: `useMai`, `createNuxtMaiState`
- Interaction constants: `INTERACTION_ACTIONS`, `INTERACTION_SUCCESS_EVENTS`
- Types: import from `@mai/mai-ui-vue` (single stable type surface)
