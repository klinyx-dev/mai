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

Use `MaiBookingFlow` when you want a client-facing clinic booking flow.

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

## `MaiBookingFlow`

`MaiBookingFlow` is the client-facing appointment booking component for clinic pages.

Flow:
1. choose specialty/reason,
2. optionally choose a doctor,
3. choose one slot from a week view,
4. sign in or sign up if needed,
5. confirm booking.

The component does not create clinic, specialty, doctor, or user identity records. The consuming app supplies that context and returns an already-known `inviteeId` after auth.

Appointment titles are generated as:

```ts
`${userDisplayName} - ${reason}`
```

Minimal shape:

```vue
<script setup lang="ts">
import { MaiBookingFlow } from "@mai/mai-ui-vue";
import { createBookSlotCommand } from "@mai/mai-web-core";

const clinic = { clinicId: "clinic-1", name: "Mai Clinic" };
const specialties = [
  { specialtyId: "dermatology", label: "Dermatology", reasonLabel: "Skin consultation" },
];
const doctors = [
  {
    doctorId: "doctor-1",
    displayName: "Dr Martin",
    specialtyIds: ["dermatology"],
    resourceOwnerId: "owner-1",
  },
];
const slotOwners = {
  "slot-1": {
    resourceOwnerId: "owner-1",
    doctorId: "doctor-1",
    doctorDisplayName: "Dr Martin",
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
    inviteeId: "patient-1",
    userDisplayName: "Camille Martin",
  };
}
</script>

<template>
  <MaiBookingFlow
    :clinic="clinic"
    :specialties="specialties"
    :doctors="doctors"
    :slot-owners="slotOwners"
    :view="{ anchorDate: '2026-05-07', visibleStartMinute: 480, visibleEndMinute: 1080 }"
    :booking="{ createAppointmentId: () => crypto.randomUUID() }"
    :actions="{ queryLayout, bookSlot, requestAuth }"
  />
</template>
```

After successful booking, the component immediately requeries availability before emitting the final confirmed state.

UI implementation must comply with the repository `DESIGN.md`: monochrome-first, calm medical utility, token-based styling, compact controls, visible focus states, and no gradients or decorative graphics.

## Public API

- Components: `MaiBoard`, `MaiBoardInteractive`, `MaiBookingFlow`
- Booking components: `MaiSpecialtyPicker`, `MaiDoctorPicker`, `MaiAvailabilityPicker`, `MaiBookingAuthGate`, `MaiBookingConfirmCard`
- Action cards: `MaiCreateSlotCard`, `MaiSlotActionsCard`, `MaiAppointmentActionsCard`
- Integration: `useMai`, `createNuxtMaiState`
- Interaction constants: `INTERACTION_ACTIONS`, `INTERACTION_SUCCESS_EVENTS`
- Types: import from `@mai/mai-ui-vue` (single stable type surface)
