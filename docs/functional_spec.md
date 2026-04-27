# Functional Specification (Near-Term)

## 1. Purpose
Build a cross-platform scheduling core focused on weekly appointment scheduling

Phase 1 is intentionally constrained to a fixed-slot booking model:
- Each slot represents a single bookable time unit
- Each slot can be booked at most once
- No partial booking

Scope:
- Weekly view only
- Display availability slots and booked appointments
- Simple CRUD (single operation only)
- Deterministic, platform-agnostic behavior

This is not a full calendar system

---

## 2. Core Concepts

### 2.1 Availability Slot
Represents a time range owned by a specific resource owner that provides bookable supply
- id
- start time
- end time
- resource owner (owner of the slot)
- created_by (actor who created the slot)
- status: available | booked | cancelled

Notes:
- The resource owner is the owner of the time
- The creator may differ from the resource owner
- Slot is the source of truth for time and ownership
- Slot is a bookable unit, not a continuous interval to be partially consumed

### 2.2 Appointment
Represents a booked time created from a slot
- id
- slot_id (reference to slot)
- invitees (list of participants)
- title
- created_by

Notes:
- Appointment must reference exactly one slot
- Appointment time is defined by the slot
- Appointment host is derived from `slot.resource owner`
- Creator of appointment may differ from host

### 2.3 Actor Roles
The system distinguishes between different actor roles:
- Resource owner: Owner of a slot
- Creator: Actor who creates a slot or appointment
- Host: Derived from slot resource owner
- Invitee: Participant in an appointment

These roles are distinct and must not be conflated

### 2.4 Week View
- 7-day view
- vertical time axis
- each day is a column

### 2.5 Slot Booking Model (Phase 1 Constraint)
The system uses a fixed-slot booking model:
- A slot is booked as a whole unit
- Partial booking is not supported
- A slot can have at most one active appointment
- Booking a slot creates an appointment and changes slot status
- Slot remains as the canonical time source

Implications:
- No slot splitting
- No partial consumption
- No derived availability segments

---

## 3. Scope (Phase 1)

### Included
- Weekly view
- Display available slots
- Display booked appointments
- Optional resource owner-scoped weekly query filtering
- Optional visible-hour window constraints for weekly query
- Add slot (single)
- Delete slot (single)
- Cancel slot
- Add appointment (single)
- Cancel appointment
- Delete appointment (single)
- Validation rules
- Semantic layout output

### Excluded
- Partial booking
- Recurrence
- Batch operations
- Multi-resource scheduling
- Drag & drop UI
- Styling / theming
- Advanced timezone handling (beyond adapter/query boundary normalization)

---

## 4. Functional Requirements

### FR-1: Render Weekly View
System must:
- Accept anchor date
- Accept optional query-boundary timezone metadata for week anchoring
- Compute 7-day range
- Return semantic layout data

### FR-2: Display Available Slots
System must:
- Show all slots with status = `available`
- Exclude slots with status = `booked` or `cancelled`

### FR-3: Display Appointments
System must:
- Show all appointments within the visible week
- Position appointments based on their slot time
- Treat appointments with missing slot references as invalid and exclude them from layout output under invariant assumptions

### FR-4: Add Slot
System must:
- Accept (start, end, resource owner, created_by)
- Validate:
  - start < end
  - resource owner and created_by are valid opaque actor references
  - no overlap with other active slots for the same resource owner

### FR-5: Delete Slot
System must:
- Remove slot by ID
- Reject if slot status = `booked`

### FR-6: Cancel Slot
System must:
- Mark slot as `cancelled`
- Prevent booking on cancelled slots

Phase 1 rule:
- Reject cancellation if slot status = `booked` 

### FR-7: Add Appointment (Book Slot)
System must:
- Accept (slot_id, invitees, title, created_by)
- Validate:
  - slot exists
  - slot status = `available`
  - slot is not cancelled
- Create appointment
- Update slot status from `available` to `booked`
- Derived host from slot.resource owner

### FR-8: Delete Appointment (Unbook Slot)
System must:
- Remove appointment by ID
- Update referenced slot status from `booked` to `available`

### FR-8b: Cancel Appointment (Authorized Unbooking)
System must:
- Accept (`appointment_id`, `cancelled_by`)
- Allow cancellation when `cancelled_by` is:
  - slot resource owner
  - appointment invitee
  - appointment creator
- Reject cancellation by non-participant actors deterministically
- Remove appointment by ID
- Update referenced slot status from `booked` to `available`
 
### FR-9: Conflict Validation
System must enforce:
- Slots cannot overlap for the same resource owner
- A slot can have at most one appointment
- Appointments cannot exist without a valid slot

### FR-10: Layout Output
System must output:
- slot nodes (available only)
- appointment nodes
- day index
- time span
- overlap grouping (if needed)
- clipping flags

System must NOT output:
- pixel values
- DOM/UI-specific data

### FR-11: Navigation
- next week
- previous week
- jump to date

### FR-12: Resource owner-Scoped Weekly Query
System must:
- Accept optional resource owner filter metadata in weekly query
- Return slot nodes only for matching resource owner
- Return appointment nodes only when referenced slot resource owner matches filter
- Preserve existing unfiltered behavior when resource owner filter is absent

### FR-13: Visible-Hour Window Query
System must:
- Accept optional visible window boundaries in minute offsets from day start
- Support deterministic clipping/filtering against the visible window
- Reject invalid window definitions deterministically
  - start/end outside `0..=1440`
  - start >= end

### FR-14: Slot Drag/Resize Rescheduling
System must:
- Support rescheduling an existing slot by updating its start/end time via a single command.
- Support UI interactions for slot drag-to-move and top/bottom edge resize.
- Keep command validation deterministic:
  - start < end
  - no overlap with other active slots for same resource owner
  - reject reschedule when slot state is not reschedulable for this phase.
- Keep adapter error envelope shape unchanged for rejected operations.

---

## 5. Business Rules

### Ownership & Roles
1. Slot resource owner is the owner of the time
2. Slot creator may differ from resource owner
3. Appointment host = slot resource owner
4. Appointment creator may differ from host
5. Creator fields are audit metadata only

### Booking Model
6. A slot is fixed bookable unit
7. A slot can have at most one active appointment
8. Booking a slot creates exactly one appointment
9. Appointment must reference exactly one slot
10. Appointment time is defined by the slot

### Slot State
11. Slot status must be one of: `available` | `booked` | `cancelled`
12. Booking a slot changes status: `available` -> `booked`
13. Deleting an appointment changes status: `booked` → `available`
14. Cancelled slots cannot be booked
15. Cancelled slots must not appear as available

### Validation
16. Slots must not overlap for the same resource owner
17. Booked slots cannot be deleted
18. Appointments cannot exist without a valid slot
19. Appointment cancellation is allowed only for slot resource owner, appointment invitee, or appointment creator

---

## 6. Acceptance Criteria
The system is complete when:
- Weekly view renders correctly
- Available slots are displayed correctly
- Booked slots are not shown as available
- Appointment creation books exactly one slot
- Appointment cancellation by participant restores slot availability
- Appointment deletion restores slot availability
- Slot ownership is always consistent
- Invalid operations are rejected
- Behavior is deterministic across platforms
- No UI-specific logic exists in the core
- Optional query filters/windows preserve backward compatibility for existing callers

---

## 7. Milestones

### M1: Core Models
- Slot (resource owner, creator, status)
- Appointment (slot reference, invitees)

### M2: Commands
- Add/Delete slot
- Cancel slot
- Add/Delete appointment
- Cancel appointment with participant authorization

### M3: Validation
- Slot overlap (per resource owner)
- Slot booking constraints

### M4: State Handling
- Slot status transitions
- Booking/Unbooking flow

### M5: Layout
- Weekly semantic layout

### M6: Integration
- Web adapter (WASM + JS/TS)
