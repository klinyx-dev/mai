# Adapter Error Codes Reference

This document defines adapter-level error codes returned by wasm JSON envelopes.

Error envelope shape:

```json
{
  "status": "error",
  "error": {
    "category": "business",
    "code": "slot_not_available",
    "message": "slot is not available"
  }
}
```

Consumer rule:
- branch on `error.code` (stable contract),
- use `error.message` for display/logging only.

## Structural Errors

| Category | Code | Source Error | Typical Cause | Caller Action |
|---|---|---|---|---|
| `structural` | `invalid_time_range` | `StructuralError::InvalidTimeRange` | `start >= end` in slot/reschedule command | Fix input time bounds and retry |
| `structural` | `empty_title` | `StructuralError::EmptyTitle` | Appointment title is blank/whitespace | Provide non-empty title and retry |
| `structural` | `invalid_visible_window` | `StructuralError::InvalidVisibleWindow` | Invalid weekly layout window (`start/end` out of range or `start >= end`) | Correct query window fields and retry |

## Referential Errors

| Category | Code | Source Error | Typical Cause | Caller Action |
|---|---|---|---|---|
| `referential` | `slot_not_found` | `ReferentialError::SlotNotFound` | Command/query references unknown slot | Refresh state and use valid slot ID |
| `referential` | `appointment_not_found` | `ReferentialError::AppointmentNotFound` | Command references unknown appointment | Refresh state and use valid appointment ID |
| `referential` | `resource_owner_not_found` | `ReferentialError::ResourceOwnerNotFound` | Actor lookup enabled and owner is unknown | Resolve a valid owner before retry |
| `referential` | `creator_not_found` | `ReferentialError::CreatorNotFound` | Actor lookup enabled and creator is unknown | Resolve a valid creator before retry |
| `referential` | `invitee_not_found` | `ReferentialError::InviteeNotFound` | Actor lookup enabled and one or more invitees are unknown | Resolve valid invitee IDs before retry |
| `referential` | `updater_not_found` | `ReferentialError::UpdaterNotFound` | Actor lookup enabled and updater is unknown | Resolve a valid updater before retry |
| `referential` | `canceller_not_found` | `ReferentialError::CancellerNotFound` | Actor lookup enabled and canceller is unknown | Resolve a valid canceller before retry |

## Business Errors

| Category | Code | Source Error | Typical Cause | Caller Action |
|---|---|---|---|---|
| `business` | `slot_id_already_exists` | `BusinessRuleError::SlotIdAlreadyExists` | `add_slot` uses an existing `slot_id` | Generate/use a new slot ID |
| `business` | `appointment_id_already_exists` | `BusinessRuleError::AppointmentIdAlreadyExists` | `add_appointment` uses an existing `appointment_id` | Generate/use a new appointment ID |
| `business` | `slot_overlap` | `BusinessRuleError::SlotOverlap` | New/rescheduled slot overlaps same owner active slot | Choose non-overlapping slot range |
| `business` | `slot_already_booked` | `BusinessRuleError::SlotAlreadyBooked` | Booking attempt targets already booked slot | Refresh availability and choose another slot |
| `business` | `slot_cancelled` | `BusinessRuleError::SlotCancelled` | Booking attempt targets cancelled slot | Refresh availability and choose another slot |
| `business` | `slot_not_available` | `BusinessRuleError::SlotNotAvailable` | Mutation requires available slot but current status is not available | Refresh state and choose valid operation |
| `business` | `cannot_delete_booked_slot` | `BusinessRuleError::CannotDeleteBookedSlot` | Deleting a booked slot | Unbook/cancel appointment first |
| `business` | `appointment_already_exists_for_slot` | `BusinessRuleError::AppointmentAlreadyExistsForSlot` | Booking attempt for a slot that already has active appointment | Refresh availability and choose another slot |
| `business` | `appointment_cancel_not_allowed` | `BusinessRuleError::AppointmentCancelNotAllowed` | Canceller is not resource owner, invitee, or creator | Use an authorized actor context |

## Contract Errors

| Category | Code | Source | Typical Cause | Caller Action |
|---|---|---|---|---|
| `contract` | `invalid_json` | Adapter boundary parse failure | Malformed command/query JSON string | Fix envelope JSON and retry |
| `contract` | `invalid_timezone` | Adapter timezone normalization | Unsupported/invalid timezone identifier | Send a valid IANA timezone or omit field |

## Notes
- These codes are mapped in `core/src/adapters/wasm/error_mapping.rs`.
- Serialization/contract coverage lives in `core/tests/serialization_contract.rs`.
