# Booking Flow Usage

`MaiBookingFlow` is a client-facing booking UI for slot selection and appointment intent submission.

It is intentionally not an admin/provider availability editor.

## Import

```ts
import "@mai/mai-ui-vue/styles.css";
import {
  MaiBookingFlow,
  useMai,
  type MaiBookSlotPayload,
  type MaiBookingActorConfig,
  type MaiBookingCategory,
  type MaiBookingContext,
  type MaiBookingLocation,
  type MaiBookingResource,
} from "@mai/mai-ui-vue";
```

## Required Inputs

1. `context`
- `contextId`
- optional `label` and metadata

2. `categories`
- booking reasons/specialties

3. `view`
- anchor date
- optional timezone and visible window

4. `booking.createAppointmentId`
- deterministic appointment ID factory

5. `actions.queryLayout`
- returns latest `WeeklyLayout` for week/filter

6. booking action
- either `actions.bookSlot(payload)` or `actions.mutateCommand(envelope)`

## Optional Inputs

- `locations` and selected-location flow
- `resources` for optional provider selection
- `slotOwners` to enrich projected slots with resource labels
- `actions.requestAuth` for lazy sign-in
- localized `copy` strings

## Event Contract

Key emits:
- `bookingSubmitted(payload)`
- `bookingConfirmed(payload)`
- `availabilityRefreshed()`
- `bookingError({ action, message })`
- `authRequired()`
- `authCompleted(identity)`

`bookingSubmitted` payload shape (`MaiBookSlotPayload`) includes:
- `appointmentId`
- `slotId`
- `inviteeId`
- `createdBy`
- `userDisplayName`
- `reason`
- `title`
- `categoryId`
- optional: notes, locationId, resourceId, metadata

## Auth Handoff Pattern

1. user selects category/resource/slot while unauthenticated.
2. user clicks confirm.
3. component emits `authRequired`.
4. app handles sign-in (modal/redirect) and returns identity via:
- `actor` prop update and/or
- `actions.requestAuth`.
5. booking continues with authenticated payload.

## Availability Refresh Pattern

After successful booking action:
1. component enters `refreshing` state.
2. component calls `actions.queryLayout`.
3. component emits `availabilityRefreshed`.
4. component emits `bookingConfirmed`.

## Forbidden Client Actions

Client-facing booking flow must not be used to:
- create slots
- reschedule slots
- cancel slots
- delete slots
- cancel existing appointments
- delete existing appointments

Use `MaiBoardInteractive` for provider/admin workflows.

## Example

Reference integration:
- `web/examples/nuxt-app/pages/resources/[contextId]/book.vue`
