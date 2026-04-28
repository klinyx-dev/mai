# Client Booking Component Status

Date: 2026-04-28
Status: completed

## Completed outcomes

- Added functional and technical specification coverage for a client-facing clinic booking flow.
- Added `@mai/mai-web-core` helpers:
  - `buildAppointmentTitle`
  - `createBookSlotCommand`
  - typed booking input contracts that map one authenticated `inviteeId` into existing `invitee_ids`.
- Added `@mai/mai-ui-vue` booking primitives:
  - `MaiSpecialtyPicker`
  - `MaiDoctorPicker`
  - `MaiAvailabilityPicker`
  - `MaiBookingAuthGate`
  - `MaiBookingConfirmCard`
- Added `MaiBookingFlow` as the exported client-facing component.
- Implemented the clinic booking funnel:
  - clinic page context,
  - specialty/reason required before availability,
  - optional doctor filter defaulting to any eligible doctor,
  - one-week slot selection,
  - sign-in/sign-up handoff before confirmation,
  - appointment title from user display name plus selected reason,
  - availability requery after successful booking.
- Kept clinic, specialty, doctor, and auth identity outside Rust core domain/layout modules.
- Added a Nuxt example route:
  - `web/examples/nuxt-app/pages/clinic/[clinicId]/book.vue`
- Updated docs:
  - `web/packages/mai-ui-vue/README.md`
  - `web/README.md`
- Tightened web package boundary checks for generated WASM/core package imports.

## Design constraints

Booking UI work follows `DESIGN.md`:
- monochrome-first,
- calm medical utility,
- token-based CSS,
- compact controls,
- visible focus states,
- no gradients,
- no decorative marketing treatment.

## Verification

- `pnpm --filter @mai/mai-web-core build`
- `pnpm --filter @mai/mai-web-core test`
- `pnpm --filter @mai/mai-ui-vue build`
- `pnpm --filter @mai/mai-ui-vue test`
- `pnpm --filter @mai/nuxt-app-example build`
- `pnpm run test`

Notes:
- `pnpm install --lockfile-only` emitted existing dependency warnings from Nuxt/transitive packages, but completed successfully.
- Nuxt build emitted a Node deprecation warning from transitive package export mappings, but completed successfully.
