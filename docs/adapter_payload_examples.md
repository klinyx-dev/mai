# Adapter Payload Examples

These examples show the stable JSON-string contract for the WASM adapter boundary.

For an end-to-end integration flow (init, mutate, query, and error handling), see `docs/wasm_adapter_usage.md`.

The boundary is envelope-based:
- mutations use `{"command": "...", "payload": ...}`
- queries use `{"query": "...", "payload": ...}`
- all responses use `{"status": "success", "data": ...}` or `{"status": "error", "error": ...}`

## Command Request: Add Slot (`WasmCommandRequest`)

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

## Command Request: Add Appointment (`WasmCommandRequest`)

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

## Query Request: Weekly Layout (`WasmQueryRequest`)

```json
{
  "query": "weekly_layout",
  "payload": {
    "anchor_date": "2026-05-07"
  }
}
```

## Query Request: Weekly Layout with Optional Timezone

```json
{
  "query": "weekly_layout",
  "payload": {
    "anchor_date": "2026-05-07",
    "timezone": "Europe/Paris"
  }
}
```

## Query Request: Weekly Layout with TM10 Filters

```json
{
  "query": "weekly_layout",
  "payload": {
    "anchor_date": "2026-05-07",
    "timezone": "Europe/Paris",
    "resource_owner_id": "owner-42",
    "visible_start_minute": 540,
    "visible_end_minute": 1020
  }
}
```

## Mutation Success Response (`WasmCommandResponse`)

```json
{
  "status": "success",
  "data": "applied"
}
```

## Query Success Response (`WasmQueryResponse`)

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

## Error Response (`WasmResponse<_, WasmAdapterError>`)

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

## Referential Error Response Example (actor lookup enabled)

```json
{
  "status": "error",
  "error": {
    "category": "referential",
    "code": "creator_not_found",
    "message": "creator not found"
  }
}
```

## Contract Error Response (invalid JSON)

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

## Contract Error Response (invalid timezone, TM8 Task 3)

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
