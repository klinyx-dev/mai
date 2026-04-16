# Functional Specification (Near-Term)

## 1. Purpose
Build a cross-platform scheduling core focused on weekly medical appointment scheduling

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
Represents a time range owned by a specific assignee that provides bookable supply
- id
- start time
- end time
- assignee (owner of the slot)
- created_by (actor who created the slot)
- status: active | booked | cancelled

Notes:
- The assignee is the owner of the time
- The creator may differ from the assignee
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
- Appointment host is derived from `slot.assignee`
- Creator of appointment may differ from host

### 2.3 Actor Roles
The system distinguishes between different actor roles:
- Assignee: Owner of a slot
- Creator: Actor who creates a slot or appointment
- Host: Derived from slot assignee
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
- Add slot (single)
- Delete slot (single)
- Cancel slot
- Add appointment (single)
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
- Advanced timezone handling

---

## 4. Functional Requirements

### FR-1: Render Weekly View
System must:
- Accept anchor date
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

### FR-4: Add Slot
System must:
- Accept (start, end, assignee, created_by)
- Validate:
  - start < end
  - assignee exists
  - created_by exists
  - no overlap with other active slots for the same assignee

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
- Derived host from slot.assignee

### FR-8: Delete Appointment (Unbook Slot)
System must:
- Remove appointment by ID
- Update referenced slot status from `booked` to `available`
 
### FR-9: Conflict Validation
System must enforce:
- Slots cannot overlap for the same assignee
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

---

## 5. Business Rules

### Ownership & Roles
1. Slot assignee is the owner of the time
2. Slot creator may differ from assignee
3. Appointment host = slot assignee
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
16. Slots must not overlap for the same assignee
17. Booked slots cannot be deleted
18. Appointments cannot exist without a valid slot

---

## 6. Acceptance Criteria
The system is complete when:
- Weekly view renders correctly
- Available slots are displayed correctly
- Booked slots are not shown as available
- Appointment creation books exactly one slot
- Appointment deletion restores slot availability
- Slot ownership is always consistent
- Invalid operations are rejected
- Behavior is deterministic across platforms
- No UI-specific logic exists in the core

---

## 7. Milestones

### M1: Core Models
- Slot (assignee, creator, status)
- Appointment (slot reference, invitees)

### M2: Commands
- Add/Delete slot
- Cancel slot
- Add/Delete appointment

### M3: Validation
- Slot overlap (per assignee)
- Slot booking constraints

### M4: State Handling
- Slot status transitions
- Booking/Unbooking flow

### M5: Layout
- Weekly semantic layout

### M6: Integration
- Web adapter (WASM + JS/TS)
