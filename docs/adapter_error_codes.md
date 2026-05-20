# Adapter Error Codes Reference

This document defines stable wasm adapter error codes.

Error envelope:

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

Consumer contract:
- branch on `error.code` and `error.category`,
- treat `error.message` as display/logging text.

## Structural

| Category | Code | Cause | User Meaning | Example |
|---|---|---|---|---|
| `structural` | `invalid_time_range` | `start >= end` | Provided time bounds are invalid | `{"status":"error","error":{"category":"structural","code":"invalid_time_range"}}` |
| `structural` | `empty_title` | Blank appointment title | Booking title is required | `{"status":"error","error":{"category":"structural","code":"empty_title"}}` |
| `structural` | `invalid_visible_window` | Invalid query window bounds | Visible-hour window is invalid | `{"status":"error","error":{"category":"structural","code":"invalid_visible_window"}}` |

## Referential

| Category | Code | Cause | User Meaning | Example |
|---|---|---|---|---|
| `referential` | `slot_not_found` | Unknown slot reference | Slot does not exist | `{"status":"error","error":{"category":"referential","code":"slot_not_found"}}` |
| `referential` | `appointment_not_found` | Unknown appointment reference | Appointment does not exist | `{"status":"error","error":{"category":"referential","code":"appointment_not_found"}}` |
| `referential` | `resource_owner_not_found` | Owner lookup failed | Owner ID is unknown | `{"status":"error","error":{"category":"referential","code":"resource_owner_not_found"}}` |
| `referential` | `creator_not_found` | Creator lookup failed | Creator ID is unknown | `{"status":"error","error":{"category":"referential","code":"creator_not_found"}}` |
| `referential` | `invitee_not_found` | Invitee lookup failed | Invitee ID is unknown | `{"status":"error","error":{"category":"referential","code":"invitee_not_found"}}` |
| `referential` | `updater_not_found` | Updater lookup failed | Updater ID is unknown | `{"status":"error","error":{"category":"referential","code":"updater_not_found"}}` |
| `referential` | `canceller_not_found` | Canceller lookup failed | Canceller ID is unknown | `{"status":"error","error":{"category":"referential","code":"canceller_not_found"}}` |

## Business

| Category | Code | Cause | User Meaning | Example |
|---|---|---|---|---|
| `business` | `slot_id_already_exists` | Duplicate slot ID | Slot ID is already in use | `{"status":"error","error":{"category":"business","code":"slot_id_already_exists"}}` |
| `business` | `appointment_id_already_exists` | Duplicate appointment ID | Appointment ID is already in use | `{"status":"error","error":{"category":"business","code":"appointment_id_already_exists"}}` |
| `business` | `slot_overlap` | Overlap with active slot for same owner | Slot conflicts with existing availability | `{"status":"error","error":{"category":"business","code":"slot_overlap"}}` |
| `business` | `slot_already_booked` | Booking on booked slot | Slot is already booked | `{"status":"error","error":{"category":"business","code":"slot_already_booked"}}` |
| `business` | `slot_cancelled` | Booking on cancelled slot | Slot is cancelled | `{"status":"error","error":{"category":"business","code":"slot_cancelled"}}` |
| `business` | `slot_not_available` | Mutation requires available slot | Slot is not available for requested action | `{"status":"error","error":{"category":"business","code":"slot_not_available"}}` |
| `business` | `cannot_delete_booked_slot` | Delete attempted on booked slot | Unbook first before deleting | `{"status":"error","error":{"category":"business","code":"cannot_delete_booked_slot"}}` |
| `business` | `appointment_already_exists_for_slot` | Existing appointment linked to slot | Slot already has an appointment | `{"status":"error","error":{"category":"business","code":"appointment_already_exists_for_slot"}}` |
| `business` | `appointment_cancel_not_allowed` | Unauthorized canceller | Actor cannot cancel this appointment | `{"status":"error","error":{"category":"business","code":"appointment_cancel_not_allowed"}}` |

## Contract

| Category | Code | Cause | User Meaning | Example |
|---|---|---|---|---|
| `contract` | `invalid_json` | Request parse failure | JSON request envelope is malformed | `{"status":"error","error":{"category":"contract","code":"invalid_json"}}` |
| `contract` | `invalid_timezone` | Unsupported timezone identifier | `timezone` field is invalid | `{"status":"error","error":{"category":"contract","code":"invalid_timezone"}}` |

## Mapping and Tests

- Mapping source: `core/src/adapters/wasm/error_mapping.rs`
- Contract tests: `core/tests/serialization_contract.rs`
