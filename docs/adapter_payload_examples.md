# Adapter Payload Examples

These examples show stable JSON payloads for adapter boundaries (WASM/HTTP/CLI), using the crate's public DTOs.

## Add Slot (`AddSlotCommand`)

```json
{
  "slot_id": "slot-1001",
  "start": "2026-05-04T09:00:00Z",
  "end": "2026-05-04T09:30:00Z",
  "assignee_id": "doctor-42",
  "created_by": "admin-7"
}
```

## Cancel Slot (`CancelSlotCommand`)

```json
{
  "slot_id": "slot-1001"
}
```

## Add Appointment (`AddAppointmentCommand`)

```json
{
  "appointment_id": "appt-9001",
  "slot_id": "slot-1001",
  "invitee_ids": ["patient-77"],
  "title": "Follow-up Consultation",
  "created_by": "staff-3"
}
```

## Weekly Query (`WeeklyLayoutQuery`)

```json
{
  "anchor_date": "2026-05-07"
}
```

## Weekly Response (`WeeklyLayout`)

```json
{
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
```

## Error Response (`SchedulerError`)

```json
{
  "kind": "Business",
  "detail": "SlotAlreadyBooked"
}
```
