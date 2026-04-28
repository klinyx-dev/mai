# Implementation Plan: Client-Facing Booking Component

## Overview

Build a client-facing booking surface, similar in spirit to Calendly or Cal.com, for a clinic page. The user chooses a consultation specialty/reason, optionally narrows to a doctor, chooses an available slot, then signs in or signs up to confirm the appointment booking. This should reuse the existing fixed-slot scheduling model: slots remain the source of truth, only `available` slots are shown to clients, and booking calls the existing `add_appointment` command path.

This plan keeps the administration calendar and public booking experience separate at the UI layer while sharing the same core contracts, WASM adapter, and web-core command/query helpers.

## Assumptions

- The client-facing flow is a web/Vue package concern first, not a new Rust domain model.
- Public booking starts from a clinic page and receives clinic/context data from the consuming app.
- The user must choose a specialty/reason before slot selection.
- Doctor selection is optional and disabled by default; without a selected doctor, availability should be shown for any eligible doctor for the selected specialty.
- A client does not create, cancel, delete, or reschedule slots from this surface.
- The booking action creates an appointment with an already-known `inviteeId` received from the consuming app after sign-in/sign-up. The component does not own identity creation in Phase 1.
- Appointment title is computed from the signed-in user's display name plus the selected consultation reason/specialty.
- The first version shows one week at a time and supports previous/next week navigation.
- After a successful booking, the flow immediately requeries availability instead of only optimistically removing the booked slot locally.
- Payments, notifications, email verification, persistence, and real-time concurrency are outside this first slice unless added to the specs.

## Architecture Decisions

- Add a new app-facing Vue component, tentatively `MaiBookingFlow`, in `@mai/mai-ui-vue`.
- Keep `MaiBoardInteractive` as the administration-side weekly board. Do not add client booking behavior into admin interaction cards.
- Query available times through existing `weekly_layout` with the currently implemented host filter boundary (`assignee_id` / equivalent web-core field), `visibleStartMinute`, `visibleEndMinute`, and timezone boundary support.
- Treat clinic, specialty, doctor, and authenticated user data as consuming-app context in Phase 1. The scheduling core should not gain clinic/specialty domain models yet.
- When a doctor is selected, query/filter availability for that doctor. When no doctor is selected, the consuming app should provide availability for all doctors eligible for the selected specialty, either by querying unfiltered layout over a specialty-scoped state or by merging per-doctor availability before passing it to the component.
- Book through existing `COMMANDS.ADD_APPOINTMENT` and `createCommandEnvelope` from `@mai/mai-web-core`.
- Expose typed component props and emitted events so consumers can use callback mode or adapter-driven command mode consistently with the current interactive board.
- Follow the hardened `@mai/mai-ui-vue` grouped configuration style where useful, mirroring the existing `view`, `actor`, and `actions` pattern rather than expanding a long flat prop list.
- UI tasks must follow `DESIGN.md`, especially monochrome-first calm medical utility, token-based styling, compact controls, visible focus states, and no gradients/random accent colors.
- Document any public contract additions in `docs/technical_spec.md` before implementation.

## Confirmed Product Decisions

- Invitee identity: provided by the consuming app as an already-known `inviteeId`.
- Availability range: one week at a time, with week navigation.
- Post-booking refresh: immediately requery availability after successful booking.
- Booking funnel: clinic page -> specialty/reason -> optional doctor -> slot -> sign-in/sign-up -> confirmation.
- Doctor selection: optional and false/off by default.
- Appointment title: computed as user display name plus selected reason.
- Auth boundary: users may browse availability before authentication, but must sign in or sign up before final booking.

## Public Contract Sketch

Component:

```ts
export interface MaiBookingFlowProps {
  clinic: {
    clinicId: string;
    name?: string;
  };
  specialties: Array<{
    specialtyId: string;
    label: string;
    reasonLabel?: string;
  }>;
  doctors?: Array<{
    doctorId: string;
    displayName: string;
    specialtyIds: string[];
  }>;
  view: {
    anchorDate: string;
    timezone?: string;
    visibleStartMinute?: number;
    visibleEndMinute?: number;
    timeLabelFormat?: "24h" | "12h";
  };
  actor: {
    inviteeId?: string;
    userDisplayName?: string;
    createdBy?: string;
  };
  booking?: {
    selectedSpecialtyId?: string;
    selectedDoctorId?: string;
    createAppointmentId?: () => string;
  };
  actions?: {
    queryLayout?: (query: BookingAvailabilityQuery) => Promise<WeeklyLayout>;
    bookSlot?: (payload: BookSlotPayload) => Promise<void>;
    requestAuth?: () => Promise<{
      inviteeId: string;
      userDisplayName: string;
    }>;
    mutateCommand?: (envelope: CommandEnvelope) => Promise<CommandResponse>;
  };
}
```

Events:

- `navigate-week` with `-1 | 0 | 1`
- `specialty-selected` with selected specialty/reason
- `doctor-selected` with selected doctor or no-doctor selection
- `slot-selected` with the selected slot/time payload
- `auth-required` when a user attempts to confirm without an `inviteeId`
- `auth-completed` after sign-in/sign-up returns user identity
- `booking-submitted` with the slot and appointment payload
- `booking-confirmed` after successful booking
- `availability-refreshed` after successful post-booking requery
- `booking-error` with `{ action, message }`

The exact names should be finalized in the spec update before coding.

## UI Design Requirements

All UI implementation tasks must use `DESIGN.md` as the design source of truth.

- Use existing design tokens or CSS variables before inventing values.
- Keep the booking UI mostly monochrome, calm, precise, and medical-utility focused.
- Use Inter for product UI and reserve Cal Sans for major headings only.
- Use real borders for scheduler/time structures and subtle grid separation where applicable.
- Keep buttons and controls compact with visible hover and focus states.
- Do not use gradients, decorative graphics, random accent colors, glassmorphism, emoji, or heavy shadows.
- Ensure available slot options are visually quiet but clearly clickable.
- Preserve mobile and desktop usability for the specialty, doctor, slot, auth, and confirmation steps.
- Validate UI work against the `DESIGN.md` component acceptance checklist.

## Phase 1: Specify the Client Booking Contract

### Task 1: Update functional spec

**Description:** Add a client-facing booking section to `docs/functional_spec.md` that defines the user flow, included scope, excluded scope, and how public availability differs from admin scheduling.

**Acceptance criteria:**
- [ ] Functional spec states that clients can view available slots and book one slot.
- [ ] Spec states the clinic booking funnel: specialty/reason, optional doctor, slot, sign-in/sign-up, confirm.
- [ ] Spec states appointment title is computed from user display name plus selected reason.
- [ ] Spec states clients cannot create, cancel, delete, or reschedule slots in Phase 1.
- [ ] Spec states invitee identity is supplied by the consuming app after sign-in/sign-up as an already-known `inviteeId`.
- [ ] Spec states the first version shows one week at a time with week navigation.
- [ ] Spec states successful booking immediately triggers an availability requery.
- [ ] Spec preserves fixed-slot constraints and slot-as-time-source rules.

**Verification:**
- [ ] Review `docs/functional_spec.md` for consistency with FR-7 booking rules.

**Dependencies:** None

**Files likely touched:**
- `docs/functional_spec.md`

**Estimated scope:** Small

### Task 2: Update technical spec and UI contract

**Description:** Add the client-facing UI/API contract to `docs/technical_spec.md`, including component boundaries, props/events, adapter command usage, and test expectations.

**Acceptance criteria:**
- [ ] Technical spec names the client-facing component and its boundary responsibilities.
- [ ] Contract uses existing `weekly_layout` query and `add_appointment` command paths.
- [ ] Contract treats clinic, specialty, doctor, and auth identity as UI/app-layer context, not Rust core domain concepts.
- [ ] Contract defines how no-doctor selection maps to all eligible doctors for the selected specialty.
- [ ] Contract aligns host/resource-owner filtering with the currently implemented weekly query payload naming.
- [ ] Contract follows grouped `@mai/mai-ui-vue` public API style where practical.
- [ ] Contract explicitly requires `DESIGN.md` compliance for client-facing UI components.
- [ ] Spec explicitly keeps booking UI orchestration out of Rust core.

**Verification:**
- [ ] Review `docs/technical_spec.md` for no new core business rules unless intentional.

**Dependencies:** Task 1

**Files likely touched:**
- `docs/technical_spec.md`

**Estimated scope:** Small

### Checkpoint: Contract

- [ ] Specs reviewed and accepted before implementation.
- [ ] Open questions below resolved or intentionally deferred.

## Phase 2: Web-Core Booking Helpers

### Task 3: Add typed booking payload helpers

**Description:** Extend `@mai/mai-web-core` with narrowly typed helper types/functions for booking a slot so UI components do not hand-build command payloads.

**Acceptance criteria:**
- [ ] Helper builds an `add_appointment` command envelope from `slotId`, `appointmentId`, already-known `inviteeId`, computed title, and `createdBy`.
- [ ] Helper maps the single `inviteeId` into the existing `invitee_ids` command payload without changing the core command shape.
- [ ] Helper includes a deterministic title builder from `userDisplayName` and selected reason.
- [ ] Existing command constants and envelope shape remain unchanged.
- [ ] Unit tests cover the generated command payload shape.

**Verification:**
- [ ] `pnpm --filter @mai/mai-web-core test`
- [ ] `pnpm --filter @mai/mai-web-core build`

**Dependencies:** Tasks 1-2

**Files likely touched:**
- `web/packages/mai-web-core/src/types.ts`
- `web/packages/mai-web-core/src/client.ts`
- `web/packages/mai-web-core/src/index.ts`
- `web/packages/mai-web-core/src/*.test.ts`

**Estimated scope:** Small

## Phase 3: Client Booking UI Package

### Task 4: Add booking flow state model

**Description:** Add a small UI state module for selected specialty, optional doctor, selected slot, auth state, submission state, refresh state, and error state. Keep it independent from admin board interaction state.

**Acceptance criteria:**
- [ ] State supports specialty selection, optional doctor selection, no slot selection, selected slot, auth required, submitting, refreshing availability, confirmed, and error states.
- [ ] State supports a refresh-after-confirmation step so availability is queried again immediately after a successful booking.
- [ ] State blocks booking confirmation until a specialty/reason, slot, and `inviteeId` are available.
- [ ] State transitions are deterministic and unit-tested.
- [ ] No admin actions such as create slot, delete slot, cancel slot, or reschedule slot are exposed.

**Verification:**
- [ ] `pnpm --filter @mai/mai-ui-vue test`

**Dependencies:** Task 3

**Files likely touched:**
- `web/packages/mai-ui-vue/src/booking/state.ts`
- `web/packages/mai-ui-vue/src/types/booking.ts`
- `web/packages/mai-ui-vue/src/booking/*.test.ts`

**Estimated scope:** Small

### Task 5: Add specialty and optional doctor selection

**Description:** Add client-facing controls for choosing consultation specialty/reason and optionally choosing a doctor. Doctor selection is off by default and can remain unset to show all eligible doctors.

**Acceptance criteria:**
- [ ] Specialty/reason selection is required before availability selection.
- [ ] Doctor selection can be unset and defaults to unset.
- [ ] Selecting a different specialty clears incompatible doctor and slot selections.
- [ ] Components emit deterministic `specialty-selected` and `doctor-selected` payloads.
- [ ] Components use `DESIGN.md` tokens, compact controls, visible focus states, and calm monochrome styling.

**Verification:**
- [ ] Component tests cover required specialty selection, optional doctor selection, default no-doctor behavior, and reset behavior.
- [ ] Manual design check against `DESIGN.md` sections 1, 8.2, 8.3, 12, 13, 15, and 16.
- [ ] `pnpm --filter @mai/mai-ui-vue test`

**Dependencies:** Task 4

**Files likely touched:**
- `web/packages/mai-ui-vue/src/booking/MaiSpecialtyPicker.tsx`
- `web/packages/mai-ui-vue/src/booking/MaiDoctorPicker.tsx`
- `web/packages/mai-ui-vue/src/styles/booking.css`
- `web/packages/mai-ui-vue/src/types/booking.ts`

**Estimated scope:** Medium

### Task 6: Add availability selection component

**Description:** Build a client-facing availability view that renders available slot options from weekly layout output for the selected specialty and optional doctor. Prefer a clean list/grid of times over the admin calendar board for Phase 1.

**Acceptance criteria:**
- [ ] Component renders only available slot nodes for the selected specialty context.
- [ ] When a doctor is selected, availability is scoped to that doctor.
- [ ] When no doctor is selected, availability represents all eligible doctors supplied by the consuming app.
- [ ] Component shows one week at a time and supports previous/next week navigation and visible-hour bounds.
- [ ] Component emits `slot-selected` with enough data to book the selected slot, including doctor/resource owner identity when available.
- [ ] Slot UI follows `DESIGN.md` scheduler guidance: visually quiet available slots, tabular time labels, subtle borders, no colorful calendar-card styling.

**Verification:**
- [ ] Component tests cover empty state, available slots, week navigation, no-doctor availability, doctor-scoped availability, and slot selection.
- [ ] Manual design check against `DESIGN.md` sections 9.2, 9.5, 9.6, 9.7, 12, 15, and 16.
- [ ] `pnpm --filter @mai/mai-ui-vue test`

**Dependencies:** Task 5

**Files likely touched:**
- `web/packages/mai-ui-vue/src/booking/MaiAvailabilityPicker.tsx`
- `web/packages/mai-ui-vue/src/styles/booking.css`
- `web/packages/mai-ui-vue/src/types/booking.ts`

**Estimated scope:** Medium

### Task 7: Add auth gate and booking confirmation form/card

**Description:** Add a lightweight auth gate and confirmation step. If the user is not signed in, the component calls the consuming app's sign-in/sign-up action before final confirmation. Once identity is available, the confirmation shows selected specialty/reason, doctor when known, selected time, and computed appointment title.

**Acceptance criteria:**
- [ ] Confirming without `inviteeId` emits `auth-required` or calls `requestAuth`.
- [ ] Successful auth stores `inviteeId` and `userDisplayName` for the pending booking.
- [ ] Appointment title is computed from `userDisplayName` and selected reason.
- [ ] User can confirm or go back to choose another slot.
- [ ] Submit button disables while booking is in progress.
- [ ] Error and success states are rendered without changing core error envelope shape.
- [ ] Auth and confirmation UI follows `DESIGN.md` cards/buttons/input rules with restrained elevation and visible focus states.

**Verification:**
- [ ] Component tests cover auth-required, auth success, title computation, confirm, back, loading, success, and error states.
- [ ] Manual design check against `DESIGN.md` sections 8.2, 8.3, 8.4, 12, 15, and 16.
- [ ] `pnpm --filter @mai/mai-ui-vue test`

**Dependencies:** Task 6

**Files likely touched:**
- `web/packages/mai-ui-vue/src/booking/MaiBookingAuthGate.tsx`
- `web/packages/mai-ui-vue/src/booking/MaiBookingConfirmCard.tsx`
- `web/packages/mai-ui-vue/src/styles/booking.css`

**Estimated scope:** Medium

### Task 8: Add `MaiBookingFlow`

**Description:** Compose specialty/reason selection, optional doctor selection, availability query, slot selection, auth gate, and booking submission into the exported app-facing component.

**Acceptance criteria:**
- [ ] Callback mode supports `queryLayout` and `bookSlot`.
- [ ] Adapter mode supports `queryAdapter`/`mutateCommand` or the existing project-equivalent query/mutation client contract.
- [ ] Component builds booking payloads from selected specialty/reason, optional doctor, selected slot, and authenticated `actor.inviteeId`.
- [ ] Component computes appointment title as user display name plus selected reason.
- [ ] Component supports sign-in/sign-up before booking confirmation through an app-provided auth callback/event.
- [ ] Successful booking triggers an availability requery before emitting the final confirmed state.
- [ ] Successful booking emits `booking-confirmed`; failures emit deterministic `booking-error`.
- [ ] Full flow layout follows `DESIGN.md`: dense information inside a spacious frame, mostly monochrome, no decorative landing-page treatment.
- [ ] Package export includes the component and its public types.

**Verification:**
- [ ] Manual design check against the full `DESIGN.md` component acceptance checklist.
- [ ] `pnpm --filter @mai/mai-ui-vue test`
- [ ] `pnpm --filter @mai/mai-ui-vue build`

**Dependencies:** Tasks 3, 5, 6, 7

**Files likely touched:**
- `web/packages/mai-ui-vue/src/MaiBookingFlow.tsx`
- `web/packages/mai-ui-vue/src/booking/index.ts`
- `web/packages/mai-ui-vue/src/index.ts`
- `web/packages/mai-ui-vue/src/types.ts`

**Estimated scope:** Medium

### Checkpoint: UI Package

- [ ] `pnpm --filter @mai/mai-web-core test`
- [ ] `pnpm --filter @mai/mai-ui-vue test`
- [ ] `pnpm --filter @mai/mai-ui-vue build`

## Phase 4: Example Integration

### Task 9: Add Nuxt example booking page

**Description:** Add a separate clinic booking route in the Nuxt example that demonstrates specialty selection, optional doctor selection, slot selection, sign-in/sign-up simulation, and booking through the WASM adapter.

**Acceptance criteria:**
- [ ] Example route does not expose admin slot mutation controls.
- [ ] Seed data creates visible available slots for multiple doctors and specialties where practical.
- [ ] Specialty selection is required before availability appears.
- [ ] Doctor selection is optional and defaults to no doctor filter.
- [ ] Confirming a slot without an invitee identity runs the sign-in/sign-up simulation before booking.
- [ ] Booking a slot creates an appointment and removes that slot from public availability after refresh/requery.
- [ ] Example passes an already-known invitee ID from app state into `MaiBookingFlow`.
- [ ] Example page follows `DESIGN.md` and does not introduce gradients, decorative graphics, colorful dashboard cards, or oversized marketing UI.

**Verification:**
- [ ] `pnpm --filter @mai/nuxt-app-example build`
- [ ] Manual design check against `DESIGN.md` sections 1, 7, 8, 9, 12, 15, and 16.
- [ ] Manual check in `pnpm run example:dev`

**Dependencies:** Task 8

**Files likely touched:**
- `web/examples/nuxt-app/pages/clinic/[clinicId]/book.vue`
- `web/examples/nuxt-app/composables/*`
- `web/examples/nuxt-app/package.json` if route/test scripts require changes

**Estimated scope:** Medium

### Task 10: Add web workspace boundary and regression coverage

**Description:** Ensure package boundaries remain clean and the client booking surface only imports package APIs.

**Acceptance criteria:**
- [ ] Boundary check still rejects direct imports from `core/pkg`.
- [ ] Booking example consumes `@mai/mai-ui-vue`, `@mai/mai-web-core`, and `@mai/mai-wasm-adapter` through public exports.
- [ ] Workspace test command includes booking component tests.

**Verification:**
- [ ] `pnpm run test`
- [ ] `pnpm run test:boundary`

**Dependencies:** Task 9

**Files likely touched:**
- `web/scripts/check-package-boundaries.mjs`
- package test files as needed

**Estimated scope:** Small

### Checkpoint: Web Integration

- [ ] `pnpm run test`
- [ ] Manual booking flow verified in Nuxt example.

## Phase 5: Documentation and Release Readiness

### Task 11: Add usage docs

**Description:** Document the new booking component usage, including callback mode, adapter mode, expected payloads, and known Phase 1 limits.

**Acceptance criteria:**
- [ ] Docs include a minimal `MaiBookingFlow` example.
- [ ] Docs explain how host/resource owner filter, timezone, known `inviteeId`, `createdBy`, and appointment IDs are supplied.
- [ ] Docs explain clinic page flow: specialty/reason, optional doctor, weekly slot choice, sign-in/sign-up, confirmation.
- [ ] Docs explain appointment title generation from user display name plus reason.
- [ ] Docs explain the week-at-a-time navigation model and refresh-after-booking behavior.
- [ ] Docs state that public booking is fixed-slot only.
- [ ] Docs state that UI implementation must comply with `DESIGN.md`.

**Verification:**
- [ ] Review docs against exported types.

**Dependencies:** Task 8

**Files likely touched:**
- `docs/technical_spec.md`
- `web/packages/mai-ui-vue/README.md` if present, otherwise package docs location selected during implementation

**Estimated scope:** Small

### Task 12: Record implementation outcome

**Description:** After implementation and validation, summarize completed decisions and test outcomes in agent memory, then remove the active plan.

**Acceptance criteria:**
- [ ] `.agents/memory/` contains a concise summary of what shipped and how it was verified.
- [ ] `.agents/plans/client-booking-component/` is removed after the work is complete.

**Verification:**
- [ ] `git status --short` shows only intentional changes.

**Dependencies:** All implementation tasks

**Files likely touched:**
- `.agents/memory/client-booking-component.md`
- `.agents/plans/client-booking-component/plan.md`

**Estimated scope:** Small

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Public booking needs organization/service discovery earlier than expected | Medium | Keep `MaiBookingFlow` host-scoped; add discovery as a separate feature later. |
| Specialty/doctor metadata grows into a domain model too early | Medium | Keep clinic, specialty, and doctor metadata in the consuming app/UI package contract; do not add Rust core concepts until scheduling rules require them. |
| Booking IDs and invitee identity are unclear | Low | Require consuming app to provide ID creation and return an already-known `inviteeId` from sign-in/sign-up before final booking. |
| Admin board interactions leak into client UI | High | Build separate booking components and tests that assert no admin mutation controls are rendered. |
| Race condition if two clients book the same slot | Medium | Existing core rejects non-available slots; persistence/server integration must enforce atomic command execution later. |
| Timezone display differs from availability query | Medium | Keep timezone at adapter/query boundary and test labels against supplied timezone assumptions. |
| Host filter naming drifts between resource-owner language and implemented `assignee_id` payload | Medium | Document the current boundary name in the technical spec and use web-core typed query helpers instead of hand-written payload strings. |
| No-doctor availability cannot be derived from a single host filter | Medium | Make the consuming app responsible for specialty-scoped aggregation or per-doctor query merging in Phase 1. |
| Booking flow UI drifts into generic SaaS/marketing styling | Medium | Make `DESIGN.md` compliance part of every UI task acceptance and manual verification. |

## Deferred Questions

- Production public API shape for unauthenticated availability browsing and authenticated booking confirmation should be defined when persistence/server integration is introduced.
