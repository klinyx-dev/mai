import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAppointmentActionPayload,
  buildCreateSlotPayload,
  buildSlotActionPayload,
  clampSlotDurationMinutes,
} from "../dist/actions/payload.js";

test("builds slot and appointment action payloads", () => {
  assert.deepEqual(buildSlotActionPayload("slot-9"), { slotId: "slot-9" });
  assert.deepEqual(buildAppointmentActionPayload("appt-4"), {
    appointmentId: "appt-4",
  });
});

test("clamps create-slot duration to configured bounds", () => {
  assert.equal(clampSlotDurationMinutes(5), 15);
  assert.equal(clampSlotDurationMinutes(45), 45);
  assert.equal(clampSlotDurationMinutes(240), 180);
});

test("builds deterministic create-slot payload when slotId provided", () => {
  const payload = buildCreateSlotPayload({
    weekStartIso: "2026-05-04",
    dayIndex: 2,
    minuteOfDay: 600,
    durationMinutes: 30,
    assigneeId: "doctor-42",
    createdBy: "ui-operator",
    slotId: "slot-fixed",
  });

  assert.deepEqual(payload, {
    slotId: "slot-fixed",
    startIso: "2026-05-06T10:00:00.000Z",
    endIso: "2026-05-06T10:30:00.000Z",
    assigneeId: "doctor-42",
    createdBy: "ui-operator",
  });
});
