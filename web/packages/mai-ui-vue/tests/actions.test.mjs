import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAppointmentActionPayload,
  buildCreateSlotPayload,
  buildCreateSlotPayloadFromRange,
  buildSlotActionPayload,
  clampSlotDurationMinutes,
  minuteOfDayFromTimeLabel,
  normalizeSlotMinuteRange,
  timeLabelFromMinuteOfDay,
} from "../dist/features/interactive-board/actions/payload.js";
import {
  actionDayLabel,
  actionTimeRangeLabel,
} from "../dist/features/interactive-board/actions/display.js";

test("builds slot and appointment action payloads", () => {
  assert.deepEqual(buildSlotActionPayload("slot-9"), { slotId: "slot-9" });
  assert.deepEqual(buildAppointmentActionPayload("appt-4"), {
    appointmentId: "appt-4",
  });
});

test("clamps create-slot duration to configured bounds", () => {
  assert.equal(clampSlotDurationMinutes(5), 5);
  assert.equal(clampSlotDurationMinutes(45), 45);
  assert.equal(clampSlotDurationMinutes(240), 180);
});

test("builds deterministic create-slot payload when slotId provided", () => {
  const payload = buildCreateSlotPayload({
    weekStartIso: "2026-05-04",
    dayIndex: 2,
    minuteOfDay: 600,
    durationMinutes: 30,
    resourceOwnerId: "owner-42",
    createdBy: "ui-operator",
    slotId: "slot-fixed",
  });

  assert.deepEqual(payload, {
    slotId: "slot-fixed",
    startIso: "2026-05-06T10:00:00.000Z",
    endIso: "2026-05-06T10:30:00.000Z",
    resourceOwnerId: "owner-42",
    createdBy: "ui-operator",
  });
});

test("parses and formats minute labels for create-slot time editing", () => {
  assert.equal(minuteOfDayFromTimeLabel("00:00"), 0);
  assert.equal(minuteOfDayFromTimeLabel("09:30"), 570);
  assert.equal(minuteOfDayFromTimeLabel("24:00"), 1440);
  assert.equal(minuteOfDayFromTimeLabel("24:30"), null);
  assert.equal(minuteOfDayFromTimeLabel("9:30"), null);

  assert.equal(timeLabelFromMinuteOfDay(0), "00:00");
  assert.equal(timeLabelFromMinuteOfDay(570), "09:30");
  assert.equal(timeLabelFromMinuteOfDay(1450), "24:00");
});

test("formats action-card day and time display labels", () => {
  assert.equal(actionDayLabel(0), "Mon");
  assert.equal(actionDayLabel(8), "Day 9");
  assert.equal(actionTimeRangeLabel(480, 540), "08:00 - 09:00");
});

test("normalizes invalid create-slot minute range deterministically", () => {
  assert.deepEqual(normalizeSlotMinuteRange(600, 580), {
    startMinute: 600,
    endMinute: 605,
  });
  assert.deepEqual(normalizeSlotMinuteRange(1439, 1430), {
    startMinute: 1435,
    endMinute: 1440,
  });
});

test("builds create-slot payload from edited range and normalizes invalid range", () => {
  const valid = buildCreateSlotPayloadFromRange({
    weekStartIso: "2026-05-04",
    dayIndex: 2,
    startMinute: 615,
    endMinute: 690,
    resourceOwnerId: "owner-42",
    createdBy: "ui-operator",
    slotId: "slot-range",
  });

  assert.deepEqual(valid, {
    slotId: "slot-range",
    startIso: "2026-05-06T10:15:00.000Z",
    endIso: "2026-05-06T11:30:00.000Z",
    resourceOwnerId: "owner-42",
    createdBy: "ui-operator",
  });

  const invalid = buildCreateSlotPayloadFromRange({
    weekStartIso: "2026-05-04",
    dayIndex: 2,
    startMinute: 620,
    endMinute: 620,
    resourceOwnerId: "owner-42",
    createdBy: "ui-operator",
    slotId: "slot-range-invalid",
  });

  assert.deepEqual(invalid, {
    slotId: "slot-range-invalid",
    startIso: "2026-05-06T10:20:00.000Z",
    endIso: "2026-05-06T10:25:00.000Z",
    resourceOwnerId: "owner-42",
    createdBy: "ui-operator",
  });
});
