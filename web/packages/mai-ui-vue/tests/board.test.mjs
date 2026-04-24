import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_VISIBLE_END_MINUTE,
  DEFAULT_VISIBLE_START_MINUTE,
  createHourTicks,
  formatMinuteLabel,
  normalizeVisibleWindow,
} from "../dist/board/model/view-model.js";
import {
  toAppointmentClickPayload,
  toEmptyCellClickPayload,
  toSlotClickPayload,
} from "../dist/board/model/interaction.js";

test("defaults to full-day visible window", () => {
  assert.equal(DEFAULT_VISIBLE_START_MINUTE, 0);
  assert.equal(DEFAULT_VISIBLE_END_MINUTE, 1440);
});

test("normalizes invalid visible window to full-day baseline", () => {
  const invalid = normalizeVisibleWindow(1200, 300);
  assert.deepEqual(invalid, { startMinute: 0, endMinute: 1440 });
});

test("uses provided valid window deterministically", () => {
  const window = normalizeVisibleWindow(540, 1020);
  assert.deepEqual(window, { startMinute: 540, endMinute: 1020 });
  assert.deepEqual(createHourTicks(window.startMinute, window.endMinute), [
    540, 600, 660, 720, 780, 840, 900, 960, 1020,
  ]);
});

test("formats minute labels in 24h and 12h modes", () => {
  assert.equal(formatMinuteLabel(0, "24h"), "00:00");
  assert.equal(formatMinuteLabel(780, "24h"), "13:00");
  assert.equal(formatMinuteLabel(0, "12h"), "12:00 AM");
  assert.equal(formatMinuteLabel(780, "12h"), "1:00 PM");
});

test("maps slot and appointment interaction payloads", () => {
  const slotEvent = {
    id: "slot-1",
    slotId: "slot-1",
    kind: "slot",
    dayIndex: 2,
    startMinute: 600,
    endMinute: 660,
  };
  const appointmentEvent = {
    id: "appt-1",
    slotId: "slot-1",
    kind: "appointment",
    dayIndex: 2,
    startMinute: 600,
    endMinute: 660,
  };
  const point = {
    clientX: 123,
    clientY: 456,
  };
  const anchorRect = {
    left: 96,
    top: 432,
    width: 180,
    height: 42,
  };

  assert.deepEqual(toSlotClickPayload(slotEvent, point, anchorRect), {
    slotId: "slot-1",
    dayIndex: 2,
    startMinute: 600,
    endMinute: 660,
    clientX: 123,
    clientY: 456,
    anchorRect,
  });

  assert.deepEqual(toAppointmentClickPayload(appointmentEvent, point, anchorRect), {
    appointmentId: "appt-1",
    slotId: "slot-1",
    dayIndex: 2,
    startMinute: 600,
    endMinute: 660,
    clientX: 123,
    clientY: 456,
    anchorRect,
  });
});

test("computes empty-cell payload minute anchor from pointer position", () => {
  const payload = toEmptyCellClickPayload({
    dayIndex: 4,
    clientX: 320,
    clientY: 450,
    top: 200,
    height: 500,
    visibleStartMinute: 0,
    totalVisibleMinutes: 1440,
    columnRect: {
      left: 280,
      top: 200,
      width: 160,
      height: 500,
    },
  });

  assert.deepEqual(payload, {
    dayIndex: 4,
    minuteOfDay: 720,
    clientX: 320,
    clientY: 450,
    columnRect: {
      left: 280,
      top: 200,
      width: 160,
      height: 500,
    },
  });
});
