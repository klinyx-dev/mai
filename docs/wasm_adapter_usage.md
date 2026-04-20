# WASM Adapter Usage Notes

This document shows how a web consumer should interact with the current WASM adapter contract.

The boundary is JSON-in / JSON-out:
- send command envelopes to mutate state
- send query envelopes to read layout
- handle a shared success/error response envelope

## Exported Adapter Surface

Current wasm-bindgen export wrapper (`core/src/adapters/wasm/mod.rs`) exposes:
- `WasmBindgenAdapter::new()`
- `execute_command_json(&str) -> String`
- `execute_query_json(&str) -> String`

When bound through `wasm-bindgen`, JavaScript should call equivalent methods with JSON strings.

## Package Build Contract (TM6c Task 1)

Near-term supported package build path:

```bash
wasm-pack build --target web --out-dir pkg --out-name mai
```

Expected generated output contract:
- `pkg/mai.js`
- `pkg/mai_bg.wasm`
- `pkg/mai.d.ts`
- `pkg/package.json`

Notes:
- This is the single documented build contract for JS consumption in this repo.
- Runtime JSON request/response envelopes remain unchanged.

### Typical JS import style

```ts
import init, { WasmBindgenAdapter } from "./pkg/mai.js";

await init();
const adapter = new WasmBindgenAdapter();
```

## Compatibility Contract (TM6b)

The JS-facing boundary must remain JSON-only:
- input type: JSON string
- output type: JSON string
- payload schema: `docs/adapter_payload_examples.md` is canonical

Stability notes:
- exported constructor name: `WasmBindgenAdapter`
- exported method names: `execute_command_json`, `execute_query_json`
- no Rust internal DTO/module paths are required by JS consumers

## End-to-End Flow

### 1. Initialize adapter state

```ts
const adapter = new WasmBindgenAdapter();
```

### 2. Add slot, then book appointment

```ts
const addSlotResponse = JSON.parse(
  adapter.execute_command_json(
    JSON.stringify({
      command: "add_slot",
      payload: {
        slot_id: "slot-1001",
        start: "2026-05-04T09:00:00Z",
        end: "2026-05-04T09:30:00Z",
        assignee_id: "doctor-42",
        created_by: "admin-7"
      }
    })
  )
);

const addAppointmentResponse = JSON.parse(
  adapter.execute_command_json(
    JSON.stringify({
      command: "add_appointment",
      payload: {
        appointment_id: "appt-9001",
        slot_id: "slot-1001",
        invitee_ids: ["patient-77"],
        title: "Follow-up Consultation",
        created_by: "staff-3"
      }
    })
  )
);
```

Expected mutation success shape:

```json
{
  "status": "success",
  "data": "applied"
}
```

### 3. Request weekly layout

```ts
const layoutResponse = JSON.parse(
  adapter.execute_query_json(
    JSON.stringify({
      query: "weekly_layout",
      payload: { anchor_date: "2026-05-07" }
    })
  )
);

if (layoutResponse.status === "success") {
  console.log(layoutResponse.data.week_start); // "2026-05-04"
  console.log(layoutResponse.data.appointments.length); // 1
}
```

### 4. Handle deterministic error payloads

```ts
const duplicateBooking = JSON.parse(
  adapter.execute_command_json(
    JSON.stringify({
      command: "add_appointment",
      payload: {
        appointment_id: "appt-9002",
        slot_id: "slot-1001",
        invitee_ids: ["patient-99"],
        title: "Conflict Attempt",
        created_by: "staff-3"
      }
    })
  )
);

if (duplicateBooking.status === "error") {
  // category: structural | referential | business | contract
  console.error(duplicateBooking.error.category); // "business"
  console.error(duplicateBooking.error.code); // "slot_already_booked"
  console.error(duplicateBooking.error.message); // human-readable message
}
```

## Error Categories

- `structural`: invalid domain shape (example: `invalid_time_range`, `empty_title`)
- `referential`: missing referenced entities (example: `slot_not_found`)
- `business`: rule violations (example: `slot_already_booked`)
- `contract`: adapter boundary problems (example: `invalid_json`)

## Source of Truth

- Payload shapes: `docs/adapter_payload_examples.md`
- Contract and wrapper implementation: `core/src/adapters/wasm/mod.rs`
