import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const wasmPath = resolve(scriptDir, "../pkg/mai_bg.wasm");
const wasmBytes = await readFile(wasmPath);

const { default: init, WasmBindgenAdapter } = await import("../pkg/mai.js");
await init({ module_or_path: wasmBytes });

const adapter = new WasmBindgenAdapter();

const addSlotResponse = JSON.parse(
  adapter.execute_command_json(
    JSON.stringify({
      command: "add_slot",
      payload: {
        slot_id: "slot-1001",
        start: "2026-05-04T09:00:00Z",
        end: "2026-05-04T09:30:00Z",
        resource_owner_id: "owner-42",
        created_by: "admin-7",
      },
    })
  )
);
assert.equal(addSlotResponse.status, "success");
assert.equal(addSlotResponse.data, "applied");

const addAppointmentResponse = JSON.parse(
  adapter.execute_command_json(
    JSON.stringify({
      command: "add_appointment",
      payload: {
        appointment_id: "appt-9001",
        slot_id: "slot-1001",
        invitee_ids: ["patient-77"],
        title: "Follow-up Consultation",
        created_by: "staff-3",
      },
    })
  )
);
assert.equal(addAppointmentResponse.status, "success");

const weeklyLayoutResponse = JSON.parse(
  adapter.execute_query_json(
    JSON.stringify({
      query: "weekly_layout",
      payload: {
        anchor_date: "2026-05-07",
        view_filter: { mode: "owners", ids: ["owner-42"] },
        visible_start_minute: 540,
        visible_end_minute: 570,
      },
    })
  )
);
assert.equal(weeklyLayoutResponse.status, "success");
assert.equal(weeklyLayoutResponse.data.week_start, "2026-05-04");
assert.equal(weeklyLayoutResponse.data.appointments[0].slot_id, "slot-1001");
assert.equal(
  weeklyLayoutResponse.data.appointments[0].appointment_id,
  "appt-9001"
);

const duplicateBookingResponse = JSON.parse(
  adapter.execute_command_json(
    JSON.stringify({
      command: "add_appointment",
      payload: {
        appointment_id: "appt-9002",
        slot_id: "slot-1001",
        invitee_ids: ["patient-99"],
        title: "Conflict Attempt",
        created_by: "staff-3",
      },
    })
  )
);
assert.equal(duplicateBookingResponse.status, "error");
assert.equal(duplicateBookingResponse.error.category, "business");
assert.equal(duplicateBookingResponse.error.code, "slot_already_booked");

const invalidWindowResponse = JSON.parse(
  adapter.execute_query_json(
    JSON.stringify({
      query: "weekly_layout",
      payload: {
        anchor_date: "2026-05-07",
        visible_start_minute: 600,
        visible_end_minute: 600,
      },
    })
  )
);
assert.equal(invalidWindowResponse.status, "error");
assert.equal(invalidWindowResponse.error.category, "structural");
assert.equal(invalidWindowResponse.error.code, "invalid_visible_window");

console.log("generated package smoke validation passed");
