# Booking Flow Contract Audit

This audit maps the current `MaiBookingFlow` contract to FR-15 in `docs/functional_spec.md` and `PQR-2` in `docs/product_quality_spec.md`.

Primary implementation source:
- `web/packages/mai-ui-vue/src/features/booking/MaiBookingFlow.tsx`

## Contract Surface

Props:
- `context`
- `locations`
- `categories`
- `resources`
- `layout`
- `availabilitySlots`
- `slotOwners`
- `view`
- `actor`
- `booking`
- `copy`
- `actions`
- `modelValue`

Emits:
- `update:modelValue`
- `navigateWeek`
- `locationSelected`
- `categorySelected`
- `resourceSelected`
- `slotSelected`
- `authRequired`
- `authCompleted`
- `bookingSubmitted`
- `bookingConfirmed`
- `availabilityRefreshed`
- `bookingError`

Typed payloads:
- `MaiBookSlotPayload`
- `MaiBookingAuthIdentity`
- `MaiBookingAvailabilitySlot`
- `MaiBookingFlowState`
- `MaiBookingError`

## Requirement Mapping

1. User starts from clinic/resource context:
- Status: supported.
- Evidence: `context: MaiBookingContext` prop.

2. User selects specialty/reason before slot:
- Status: supported.
- Evidence: `MaiCategoryPicker`; state transition via `selectBookingCategory`.

3. Optional doctor/resource selection:
- Status: supported.
- Evidence: `MaiResourcePicker`; `selectedResourceId` is nullable; `resourceSelected` emit allows `null`.

4. No selected doctor means all eligible providers for category:
- Status: supported.
- Evidence: `eligibleResourcesForCategory`; slot filtering by eligible owner IDs when no resource selected.

5. Weekly slot selection with previous/next navigation:
- Status: supported.
- Evidence: `MaiAvailabilityPicker` emits `navigateWeek` and `slotSelected`.

6. Browse before authentication:
- Status: supported.
- Evidence: auth requested only in `submitBooking` via `ensureAuth`; selection/browsing works before auth.

7. Auth required before final confirmation:
- Status: supported.
- Evidence: `beginBookingConfirmation` returns `auth-required` until identity exists.

8. Auth identity comes from consuming app:
- Status: supported.
- Evidence: `actor` prop and `actions.requestAuth` callback.

9. Title from user display name + reason:
- Status: supported.
- Evidence: payload title built with `buildAppointmentTitle`.

10. Availability refresh after booking:
- Status: supported.
- Evidence: `markAvailabilityRefreshing` and `actions.queryLayout` call before `bookingConfirmed`.

11. Client flow must not expose slot/admin mutation actions:
- Status: supported.
- Evidence: `MaiBookingFlow` actions only support `queryLayout`, `bookSlot`, `requestAuth`, `mutateCommand` for add-appointment path.

## Gaps Resolved in Phase 2

1. Booking emit payload validation hardening:
- `isBookSlotPayload` now validates required fields:
  - `appointmentId`
  - `slotId`
  - `inviteeId`
  - `createdBy`
  - `userDisplayName`
  - `reason`
  - `title`
  - `categoryId`

2. Emit contract tests:
- Added test coverage for valid/invalid `bookingSubmitted` payload validation.

## Consumer Responsibilities

The consuming app must provide:
- context and category/resource data,
- auth identity source,
- appointment ID generation strategy,
- backend or adapter mutation execution,
- availability query implementation.

The consuming app should not use booking flow as an admin slot editor.
