# Technical Specification (Near-Term)

# 1. Objective

Build a cross-platform scheduling core for a weekly medical booking use case, implemented in Rust first, with deterministic business logic and layout computation that can later be consumed by the Web, mobile or backend systems

This core is not a UI library

This is a domain + layout engine that:
- stores and validates scheduling entities
- executes commands
- enforces business rules
- computes semantic weekly layout data
- exposes a stable API for adapters

Phase 1 is intentionally limited to a fixed-slot booking model:
- one slot = one bookable unit
- no partial booking
- no slot splitting
- one slot can have at most one active appointment

This technical spec is derived from the current functional requirements and business rules in the functional spec

## 2. Architectural Principles

### 2.1 Rust-first core
The core must be implemented in Rust from the beginning

Reason:
- Business logic is deterministic and portable
- Layout calculation is pure computation
- Future reuse across WASM / server / native is straightforward
- Avoid maintaining a TypeScript-first core that later needs re-porting

### 2.2 Headless Architecture
The core must not know anything about:
- DOM
- CSS
- Rendering frameworks
- Browser layout primitives
- pixel-based UI behavior

The core returns semantic data only

### 2.3 Pure core + Explicit state transitions
Business logic should be expressed through:
- Pure data models
- Explicit commands
- Deterministic validation
- Explicit state transitions

Avoid hidden side effects

### 2.4 Stable adapter boundary
The Rust core should expose a narrow API boundary so that:
- WASM adapter can call it from web apps
- Backend services can call it directly in Rust
- Future native/mobile bindings remain possible

### 2.5 Deterministic behavior 
Given the same input state and command, the result must always be identical:
- Same validation result
- Same state mutation result
- Same layout output ordering

No implicit clock access inside domain logic
No random ordering
No platform-dependent behavior

## 3. High-level Model Structure

```rust
core/
├── domain/
│   ├── ids.rs
│   ├── actor.rs
│   ├── slot.rs
│   ├── appointment.rs
│   ├── time_range.rs
│   ├── week.rs
│   └── enums.rs
├── commands/
│   ├── add_slot.rs
│   ├── delete_slot.rs
│   ├── cancel_slot.rs
│   ├── add_appointment.rs
│   └── delete_appointment.rs
├── validation/
│   ├── mod.rs
│   ├── slot_validation.rs
│   ├── appointment_validation.rs
│   └── invariants.rs
├── state/
│   ├── schedule_state.rs
│   ├── repository_view.rs
│   └── reducers.rs
├── layout/
│   ├── weekly_layout.rs
│   ├── weekly_layout/
│   │   ├── query.rs
│   │   ├── position.rs
│   │   ├── projection.rs
│   │   └── tests.rs
│   ├── overlap.rs
│   ├── clipping.rs
│   └── output.rs
├── application/
│   ├── scheduler_service.rs
│   ├── command_result.rs
│   └── errors.rs
├── adapters/
│   └── wasm/   // later phase
└── lib.rs
```

This separation matters:
- **domain**: core entities and value objects
- **commands**: input contracts for mutations
- **validation**: business rule enforcement
- **state**: canonical in-memory schedule representation
- **layout**: weekly semantic layout computation
- **application**: orchestration layer for commands and queries
- **adapters**: platform bindings, not core logic

## 4. Core Domain Model

### 4.1 IDs
Use strongly typed IDs instead of raw strings throughout the core

Example:

```rust
pub struct SlotId(String)
pub struct AppointmentId(String)
pub struct ActorId(String)
```

Requirements:
- opaque types
- equality/hash support
- serializable/deserializable
- no business meaning embedded in ID format

The core should accept IDs as provided values, not generate them implicitly unless deprecated helper is added later 

### 4.2 Actor model
At Phase 1, actors only need identity, not a full profile model

```rust
pub struct ActorRef {
    pub id: ActorId,
}
```

The system distinguishes these roles logically:
- slot assignee
- slot creator
- appointment creator
- appointment invitee
- appointment host (derived)

These roles must remain separate at the model level even if they share the same underlying ID type

### 4.3 Time range
Use an explicit value object:

```rust
pub struct TimeRange {
    pub start: DateTime<Utc>,
    pub end: DateTime<Utc>
}
```

Rules:
- start < end
- immutable once created
- shared by validation and layout

Why:
- avoids duplicated start/end checks across entities
- centralizes overlap logic

### 4.4 Slot
```rust
pub enum SlotStatus {
    Available,
    Booked,
    Cancelled,
}

pub struct Slot {
    pub id: SlotId,
    pub time: TimeRange,
    pub assignee_id: ActorId,
    pub created_by: ActorId,
    pub status: SlotStatus,
}
```

Constraints from the functional spec:
- slot is the canonical time source
- slot is owned by the assignee
- creator may differ from assignee
- slot is not partially consumable
- status is explicit and persistent

### 4.5 Appointment

```rust
pub struct Appointment {
    pub id: AppointmentId,
    pub slot_id: SlotId,
    pub invitee_ids: Vec<ActorId>,
    pub title: String,
    pub created_by: ActorId,
}
```

Derived data:
- host is not stored directly
- host = slot.assignee_id

Reason:
- Avoids duplication
- Avoids drift between appointment host and slot owner
- Preserves slot as source of truth

### 4.6 Week Range
```rust
pub struct WeekRange {
    pub start: NaiveDate,
    pub end: NaiveDate, // exclusive
}
```

## 5. Canonical State Model

### 5.1 Schedule State
The core needs a canonical in-memory representation:

```rust
pub struct ScheduleState {
    pub slots: HashMap<SlotId, Slot>,
    pub appointments: HashMap<AppointmentId, Appointment>,
}
```

This is the minimal state for Phase 1

### 5.2 Derived relationship
Do not duplicate relationship maps as canonical state unless profiling later proves necessary

Derive when needed:
- appointment by slot
- slots by assignee
- visible items by week

Reason:
- Phase 1 prioritizes correctness and simplicity over premature indexing

### 5.3 Repository abstraction
The core should not depend on a database

But it should be possible to integrate with storage later

Recommended approach:

- keep the domain/application layer repository-agnostic
- optionally define traits for persistence later
- Phase 1 can operate entirely on in-memory state

Example:
```rust
pub trait ScheduleRepository {
    fn load_state(&self) -> ScheduleState;
    fn save_state(&mut self, state: &ScheduleState);
}
```

This trait is optional in the first implementation.
A plain in-memory application service is sufficient initially.

## 6. Command Model

Commands should be explicit input DTOs

### 6.1 Add slot
```rust
pub struct AddSlotCommand {
    pub slot_id: SlotId,
    pub start: DateTime<Utc>,
    pub end: DateTime<Utc>,
    pub assignee_id: ActorId,
    pub created_by: ActorId,
}
```

### 6.2 Delete slot
```rust
pub struct DeleteSlotCommand {
    pub slot_id: SlotId,
}
```

### 6.3 Cancel slot
```rust
pub struct CancelSlotCommand {
    pub slot_id: SlotId,
}
```

### 6.4 Add appointment
```rust
pub struct AddAppointmentCommand {
    pub appointment_id: AppointmentId,
    pub slot_id: SlotId,
    pub invitee_ids: Vec<ActorId>,
    pub title: String,
    pub created_by: ActorId,
}
```

### 6.5 Delete appointment
```rust
pub struct DeleteAppointmentCommand {
    pub appointment_id: AppointmentId,
}
```

All mutation entrypoints should use these command structs rather than loose parameters

## 7. Validation Design
Validation must be centralized and deterministic

### 7.1 Validation layers
Split validation into three categories:

#### Structural validation
Checks shape and required fields:
- start exists
- end exists
- start < end
- IDs are present
- title length constraints if any

#### Referential validation
Checks referenced entities:
- slot exists
- appointment exists
- creator exists if actor registry is available
- assignee exists if actor registry is available

#### Business invariant validation
Checks scheduling rules:
- no overlapping active slots for same assignee
- slot must be available before booking
- booked slot cannot be deleted
- cancelled slot cannot be booked
- one slot can have at most one appointment

This structure prevents rule sprawl

### 7.2 Overlap rule
The functional spec requires:
- slots cannot overlap for the same assignee

Technical interpretation:
- apply overlap checks against slots with status Available or Booked
- ignore Cancelled slots for conflict purposes unless business later decides historical cancelled slots should still block time

Near-term recommendation:
- Cancelled slots do not participate in overlap blocking
- they are historical records, not active supply

### 7.3 Error model
Use typed errors, not raw strings.

Example:
```rust
pub enum SchedulerError {
    SlotNotFound,
    AppointmentNotFound,
    InvalidTimeRange,
    SlotOverlap,
    SlotAlreadyBooked,
    SlotCancelled,
    SlotNotAvailable,
    CannotDeleteBookedSlot,
    AppointmentAlreadyExistsForSlot,
    InvariantViolation(String),
}
```

This is critical for:
- WASM boundary mapping
- frontend error handling
- reliable tests

## 8. State Transition Rules
State transitions must be explicit and enforced in one place

### 8.1 Slot lifecycle
```
Available -> Booked
Available -> Cancelled
Booked -> Available   (when appointment deleted)
Booked -> Cancelled   (not allowed in Phase 1)
Cancelled -> anything (not allowed in Phase 1)
```

This directly matches the current business rules in the functional spec

### 8.2 Booking flow
When adding an appointment:
1. Verify slot exists
2. Verify slot status = `Available`
3. Verify no appointment already references slot
4. Create appointment
5. Update slot status to `Booked`

This must be atomic at application-layer level

This must never be a persisted intermediate state where:
- appointment exists but slot still available
- slot booked but appointment missing

### 8.3 Unbooking flow
When deleting an appointment:
1. Verify appointment exists
2. Load referenced slot
3. Delete appointment
4. Update slot status to `Available`

Also atomic

### 8.4 Delete slot flow
Deleting a slot is allowed only when:
- slot exists
- slot status is not Booked

Recommended near-term handling:
- hard delete from state

Alternative later:
- soft delete / archived status

Phase 1 does not need archival semantics

## 9. Application Service Layer
Use one façade service to orchestrate command execution and queries

```rust
pub struct SchedulerService {
    state: ScheduleState,
}
```

Example API:
```rust
impl SchedulerService {
    pub fn add_slot(&mut self, cmd: AddSlotCommand) -> Result<(), SchedulerError>;
    pub fn delete_slot(&mut self, cmd: DeleteSlotCommand) -> Result<(), SchedulerError>;
    pub fn cancel_slot(&mut self, cmd: CancelSlotCommand) -> Result<(), SchedulerError>;
    pub fn add_appointment(&mut self, cmd: AddAppointmentCommand) -> Result<(), SchedulerError>;
    pub fn delete_appointment(&mut self, cmd: DeleteAppointmentCommand) -> Result<(), SchedulerError>;

    pub fn get_weekly_layout(&self, query: WeeklyLayoutQuery) -> WeeklyLayout;
}
```

Reason:
- one stable boundary for adapters
- easy WASM export target
- keeps domain operations centralized

## 10. Weekly Layout Engine

### 10.1 Role of layout engine
The layout engine converts schedule state into semantic weekly view data.

- It does not render UI
- It does not compute pixels
- It does not know CSS or screen width

This is explicitly required by the functional spec, which says layout output must exclude UI-specific and pixel-based data

### 10.2 Input query
```rust
pub struct WeeklyLayoutQuery {
    pub anchor_date: NaiveDate,
}
```

Optional later additions:
- timezone
- visible hours
- assignee filter

Not needed in first pass

### 10.3 Output shape
```rust
pub struct WeeklyLayout {
    pub week_start: NaiveDate,
    pub week_end: NaiveDate,
    pub slots: Vec<SlotLayoutNode>,
    pub appointments: Vec<AppointmentLayoutNode>,
}
```

#### Slot layout node
```rust
pub struct SlotLayoutNode {
    pub slot_id: SlotId,
    pub day_index: u8,
    pub start_minute: u16,
    pub end_minute: u16,
    pub clipped_start: bool,
    pub clipped_end: bool,
}
```

#### Appointment layout node
```rust
pub struct AppointmentLayoutNode {
    pub appointment_id: AppointmentId,
    pub slot_id: SlotId,
    pub day_index: u8,
    pub start_minute: u16,
    pub end_minute: u16,
    pub clipped_start: bool,
    pub clipped_end: bool,
}
```

Optional if overlap presentation is needed:

```rust
pub struct OverlapInfo {
    pub group_id: u32,
    pub column_index: u16,
    pub column_count: u16,
}
```

But for current functional scope, overlap grouping is not essential for slots if overlapping slots are already forbidden per assignee. It only becomes relevant if the UI shows multiple assignees together in a single day column

### 10.4 Why minute offsets
Use:
- `day_index 0..6`
- `start_minute`, `end_minute` from local day start

This gives the UI enough semantic positioning data without hardcoding pixels

### 10.5 Visible data filtering
Layout query rules:
- include only slots in visible week where status = `Available`
- exclude Booked and Cancelled slots from slot node output
- include appointments whose referenced slot falls within visible week
- appointments with invalid/missing slot references are excluded by invariant assumptions

This follows FR-2 and FR-3 in the functional spec

### 10.6 Deterministic ordering
Sort output deterministically:
- day index
- start time
- end time
- ID

This prevents platform-specific ordering drift.

## 11. Time Handling Strategy

### 11.1 Internal standard
Use UTC internally for persisted timestamps

Reason:
- deterministic comparisons
- avoids DST ambiguity in core state logic
- easier cross-platform serialization

### 11.2 Near-term simplification
The functional spec excludes advanced timezone handling

Therefore:
- store slot/appointment times in UTC
- weekly query may assume a single consumer timezone at adapter level
- do not build full timezone conversion rules into Phase 1 core

### 11.3 Boundary rule
Timezone conversion should happen at adapter/application boundary when constructing layout queries or displaying dates.

The core should not depend on browser locale APIs.

## 12. Serialization and Interop

### 12.1 Serde

All public DTOs and result structs should derive:
- Serialize
- Deserialize

Reason:
- easy JSON exchange
- easy WASM interop
- persistence support later

### 12.2 WASM adapter boundary (current baseline)
The adapter boundary is JSON-string based and envelope-driven.

Requests:
- command envelope: `{"command":"<name>","payload":{...}}`
- query envelope: `{"query":"<name>","payload":{...}}`

Responses:
- success: `{"status":"success","data":...}`
- error: `{"status":"error","error":{...}}`

Error payload must use adapter-safe shape:

```rust
pub struct WasmAdapterError {
    pub category: WasmErrorCategory, // structural | referential | business | contract
    pub code: String,                // machine-readable snake_case code
    pub message: String,             // human-readable message
}
```

Malformed JSON at the boundary must map to:
- `category = contract`
- `code = invalid_json`

This keeps adapter behavior parseable and deterministic for JS/TS consumers.

### 12.3 WASM export layer
The adapter wrapper should be exposed through `wasm-bindgen` without changing core business logic.

Export requirements:
- Export a constructible adapter state wrapper around `WasmSchedulerAdapter`.
- Export mutation and query entrypoints that accept `&str` JSON and return JSON `String`.
- Preserve the existing JSON envelope contract exactly (no shape drift).
- Do not duplicate validation or state-transition rules in exported functions.
- Keep wasm-specific code confined to adapter module boundaries.

Verification requirements:
- Rust tests for adapter wrapper behavior remain green.
- Add a web-consumer smoke example/test that calls exported methods and asserts response shape.

### 12.4 WASM package consumption layer (next step)
After exports exist, the next step is to make the adapter straightforward to consume from JS tooling.

Goals:
- Build a distributable wasm package shape for web consumers.
- Verify the generated package can be initialized and imported from JS.
- Keep the runtime contract unchanged from the current JSON envelope boundary.

Requirements:
- Define one supported packaging tool/command for near-term consumption:
  - `wasm-pack build --target web --out-dir pkg --out-name mai`
- Treat generated `pkg/` output as the package contract for docs/smoke checks:
  - `pkg/mai.js` (ES module glue with default `init`)
  - `pkg/mai_bg.wasm` (WASM binary)
  - `pkg/mai.d.ts` (TypeScript declarations)
  - `pkg/package.json` (generated package metadata)
- Verify consumer import pattern around generated package output (`init` + exported class):
  - `import init, { WasmBindgenAdapter } from "./pkg/mai.js"`
  - `await init()`
- Add a package-level smoke path that proves a JS consumer can:
  - initialize the wasm module
  - construct `WasmBindgenAdapter`
  - issue at least one command and one query
  - parse success/error envelopes
- Keep packaging concerns in adapter/build layers, not in domain/application modules.

Non-goals:
- No UI rendering layer.
- No change to request/response JSON shapes.
- No new business rules.

## 13. Testing Strategy

### 13.1 Unit tests
Each domain rule should have direct unit coverage.

Minimum cases:
- valid slot creation
- invalid slot time range
- slot overlap rejection
- slot delete rejection when booked
- booking available slot
- booking cancelled slot rejected
- booking already booked slot rejected
- deleting appointment restores slot availability
- appointment cannot exist without slot

### 13.2 Reducer/application tests
Test command sequences against full state.

Examples:
- add slot -> add appointment -> delete appointment
- add slot -> cancel slot -> add appointment rejected
- add two overlapping slots same assignee rejected
- add overlapping slots different assignees allowed

### 13.3 Layout tests
Verify:
- correct week filtering
- correct day index computation
- correct minute offsets
- correct exclusion of booked/cancelled slots
- deterministic ordering
- clipping flags for items spanning outside visible week if that case is later allowed

### 13.4 Property tests
Useful for overlap logic and ordering stability.

Candidates:
- overlap symmetry
- no false negatives on interval conflict
- sort order deterministic under shuffled input

### 13.5 Snapshot tests
Good for weekly layout output DTOs, especially when used by UI consumers.

## 14. Performance Expectations
Phase 1 does not require aggressive optimization

Expected scale:
- weekly medical scheduling
- moderate number of slots and appointments
- single-user or small practice view sizes

Therefore:
- correctness first
- simple in-memory filtering/sorting is acceptable
- avoid premature interval trees or complex indexing

Only optimize after profiling

## 15. Public API Design Guidelines

### 15.1 Keep API small
Near-term public API should expose only:
- state mutation commands
- weekly layout query
- optional raw read/query methods

### 15.2 No leaking internal invariants
Consumers should not mutate slots/appointments directly

Bad:
```rust
service.state.slots.insert(...)
```

Good:
```rust
service.add_slot(cmd)
```

### 15.3 Explicit result types
Every mutation returns:
- success
- typed error

No silent no-op behavior

## 16. Recommended Crates
Near-term Rust dependencies:
- chrono for datetime handling
- serde for serialization
- thiserror for typed errors
- uuid only if core later generates IDs
- wasm-bindgen only in adapter crate/module, not deep in core
- proptest for property testing

Avoid heavy framework dependencies

## 17. Non-Goals
Phase 1 technical non-goals:
- recurrence engine
- partial slot consumption
- split/merge slot logic
- drag/drop interaction logic
- persistence engine abstraction with full DB support
- permissions/ACL system
- multi-resource optimization
- real-time sync/conflict resolution
- pixel layout engine
- theming/styling concerns

These are intentionally excluded because they are not required by the current functional scope

## 18. Milestone-Oriented Implementation Plan

### TM1: Domain foundation
Deliver:
- typed IDs
- TimeRange
- Slot
- Appointment
- enums
- error model

### TM2: State and commands
Deliver:
- ScheduleState
- command DTOs
- SchedulerService
- add/delete/cancel slot
- add/delete appointment

### TM3: Validation layer
Deliver:
- overlap validation
- referential validation
- state transition enforcement
- invariant tests

### TM4: Weekly layout engine
Deliver:
- week range calculation
- filtering
- day index / minute offsets
- semantic node output
- deterministic ordering tests

### TM5: Serialization boundary
Deliver:
- serde DTOs
- stable request/response structs
- adapter-friendly API contracts

### TM6: WASM adapter
Deliver:
- web-consumable exports
- JS/TS integration contract
- example usage from frontend

Near-term sequencing:
- TM6a: adapter contract + state wrapper + adapter-safe error mapping (completed)
- TM6b: `wasm-bindgen` exports over existing JSON adapter wrapper (completed)
- TM6c: package/build verification for real JS consumption (next)

## 19. Open Technical Decisions
These should be locked before implementation to avoid churn

### 19.1 Slot status naming
Current functional spec is inconsistent between active and available

Technical spec should standardize on:
- Available
- Booked
- Cancelled

### 19.2 ID ownership
Decide whether IDs are:
- generated outside the core and passed in, or
- generated by the core

Near-term recommendation:
- generated outside the core
- core remains deterministic and simpler

### 19.3 Actor existence validation
The functional spec says assignee/creator should exist, but the current core does not define an actor repository

Near-term recommendation:
- treat actor IDs as valid opaque references
- do not implement actor registry validation inside the core yet
- if needed later, introduce a collaborator trait for actor existence checks

### 19.4 Cancelled slot retention
Decide whether cancelled slots remain in state forever or can be garbage-collected externally

Near-term recommendation:
- keep them in state
- exclude them from availability/layout
- allow higher layers to archive/purge later

## 20. Acceptance Criteria for the Technical Spec
The implementation satisfies this technical spec when:
- A Rust crate exposes typed domain models and command APIs
- Slot and appointment invariants are enforced centrally
- Booking/unbooking correctly updates slot status
- Weekly layout returns semantic nodes only, with no UI-specific values
- Output is deterministic for the same input
- Core logic is platform-agnostic
- The codebase is ready for a WASM adapter without rewriting business logic

## 21. Recommended Final Position
For this project, the correct near-term architecture is:
- Rust as the single source of truth for core business logic
- Headless scheduling engine
- fixed-slot model
- explicit state transitions
- semantic weekly layout output
- WASM adapter later, not TypeScript core first

Anything else creates unnecessary rework
