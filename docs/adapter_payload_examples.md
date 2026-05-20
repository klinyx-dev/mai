# Adapter Payload Examples

These examples define the stable wasm adapter JSON contract.

For integration usage, see `docs/wasm_adapter_usage.md`.

## Envelope Shapes

Command request:

```json
{
  "command": "<command_name>",
  "payload": {}
}
```

Query request:

```json
{
  "query": "<query_name>",
  "payload": {}
}
```

Success response:

```json
{
  "status": "success",
  "data": {}
}
```

Error response:

```json
{
  "status": "error",
  "error": {
    "category": "structural",
    "code": "invalid_time_range",
    "message": "start must be before end"
  }
}
```

## Commands

### `add_slot`

Request:

```json
{
  "command": "add_slot",
  "payload": {
    "slot_id": "slot-1001",
    "start": "2026-05-04T09:00:00Z",
    "end": "2026-05-04T09:30:00Z",
    "resource_owner_id": "owner-42",
    "created_by": "admin-7"
  }
}
```

Success:

```json
{
  "status": "success",
  "data": "applied"
}
```

### `delete_slot`

Request:

```json
{
  "command": "delete_slot",
  "payload": {
    "slot_id": "slot-1001"
  }
}
```

### `cancel_slot`

Request:

```json
{
  "command": "cancel_slot",
  "payload": {
    "slot_id": "slot-1001"
  }
}
```

### `reschedule_slot`

Request:

```json
{
  "command": "reschedule_slot",
  "payload": {
    "slot_id": "slot-1001",
    "new_start": "2026-05-04T10:00:00Z",
    "new_end": "2026-05-04T10:30:00Z",
    "updated_by": "admin-7"
  }
}
```

### `add_appointment`

Request:

```json
{
  "command": "add_appointment",
  "payload": {
    "appointment_id": "appt-9001",
    "slot_id": "slot-1001",
    "invitee_ids": ["patient-77"],
    "title": "Follow-up Consultation",
    "created_by": "staff-3"
  }
}
```

### `cancel_appointment`

Request:

```json
{
  "command": "cancel_appointment",
  "payload": {
    "appointment_id": "appt-9001",
    "cancelled_by": "patient-77"
  }
}
```

### `delete_appointment`

Request:

```json
{
  "command": "delete_appointment",
  "payload": {
    "appointment_id": "appt-9001"
  }
}
```

## Queries

### `weekly_layout` (basic)

Request:

```json
{
  "query": "weekly_layout",
  "payload": {
    "anchor_date": "2026-05-07"
  }
}
```

### `weekly_layout` (timezone)

Request:

```json
{
  "query": "weekly_layout",
  "payload": {
    "anchor_date": "2026-05-07",
    "timezone": "Europe/Paris"
  }
}
```

### `weekly_layout` (owner filter + visible window)

Request:

```json
{
  "query": "weekly_layout",
  "payload": {
    "anchor_date": "2026-05-07",
    "view_filter": {
      "mode": "owners",
      "ids": ["owner-42"]
    },
    "visible_start_minute": 540,
    "visible_end_minute": 1020
  }
}
```

### `weekly_layout` (`none` filter)

Request:

```json
{
  "query": "weekly_layout",
  "payload": {
    "anchor_date": "2026-05-07",
    "view_filter": {
      "mode": "none"
    }
  }
}
```

### `weekly_layout` (`group` filter)

Request:

```json
{
  "query": "weekly_layout",
  "payload": {
    "anchor_date": "2026-05-07",
    "view_filter": {
      "mode": "group",
      "ids": ["group-a"]
    }
  }
}
```

Success:

```json
{
  "status": "success",
  "data": {
    "week_start": "2026-05-04",
    "week_end": "2026-05-11",
    "slots": [
      {
        "slot_id": "slot-1002",
        "day_index": 2,
        "start_minute": 540,
        "end_minute": 570,
        "clipped_start": false,
        "clipped_end": false
      }
    ],
    "appointments": [
      {
        "appointment_id": "appt-9001",
        "slot_id": "slot-1001",
        "day_index": 0,
        "start_minute": 540,
        "end_minute": 570,
        "clipped_start": false,
        "clipped_end": false
      }
    ]
  }
}
```

## Error Examples

Business:

```json
{
  "status": "error",
  "error": {
    "category": "business",
    "code": "slot_already_booked",
    "message": "slot is already booked"
  }
}
```

Referential:

```json
{
  "status": "error",
  "error": {
    "category": "referential",
    "code": "slot_not_found",
    "message": "slot not found"
  }
}
```

Structural:

```json
{
  "status": "error",
  "error": {
    "category": "structural",
    "code": "invalid_visible_window",
    "message": "invalid visible window"
  }
}
```

Contract (`invalid_json`):

```json
{
  "status": "error",
  "error": {
    "category": "contract",
    "code": "invalid_json",
    "message": "expected `,` or `}` at line 1 column 49"
  }
}
```

Contract (`invalid_timezone`):

```json
{
  "status": "error",
  "error": {
    "category": "contract",
    "code": "invalid_timezone",
    "message": "invalid timezone value"
  }
}
```

## Phase 5 Planned Additive Payloads (Draft, Not Implemented)

These payloads are contract design drafts for Phase 5 (`docs/advanced_scheduling_spec.md`).
They are not accepted by the current runtime yet and must be released as additive commands/queries.

### `add_recurring_template` (draft)

```json
{
  "command": "add_recurring_template",
  "payload": {
    "template_id": "tmpl-1001",
    "resource_owner_id": "owner-42",
    "weekday": 1,
    "start_minute": 540,
    "end_minute": 600,
    "effective_from": "2026-06-01",
    "effective_until": "2026-12-31",
    "created_by": "admin-7"
  }
}
```

### `apply_recurring_templates` (draft)

```json
{
  "command": "apply_recurring_templates",
  "payload": {
    "week_start": "2026-06-01",
    "owner_ids": ["owner-42"],
    "dry_run": false,
    "created_by": "admin-7"
  }
}
```

### `add_slots_batch` (draft)

```json
{
  "command": "add_slots_batch",
  "payload": {
    "mode": "atomic",
    "slots": [
      {
        "slot_id": "slot-2001",
        "start": "2026-06-02T09:00:00Z",
        "end": "2026-06-02T09:30:00Z",
        "resource_owner_id": "owner-42",
        "created_by": "admin-7"
      }
    ]
  }
}
```

### `weekly_layout` with blackout/capacity projection (draft fields)

```json
{
  "query": "weekly_layout",
  "payload": {
    "anchor_date": "2026-06-04",
    "include_capacity": true,
    "include_blackout_windows": true
  }
}
```
