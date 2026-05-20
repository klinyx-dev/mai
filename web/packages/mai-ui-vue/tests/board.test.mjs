import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_VISIBLE_END_MINUTE,
  DEFAULT_VISIBLE_START_MINUTE,
  createHourTicks,
  formatMinuteLabel,
  mapBlackoutWindows,
  normalizeVisibleWindow,
} from "../dist/features/board/internal/model/view-model.js";
import {
  buildNowIndicatorForDate,
  buildNowIndicatorForWeek,
  localIsoDateFromDate,
  minuteOfDayFromDate,
} from "../dist/features/board/internal/model/now-indicator.js";
import { millisecondsUntilNextMinute } from "../dist/features/board/internal/state/now.js";
import {
  toAppointmentClickPayload,
  toEmptyCellClickPayload,
  toSlotClickPayload,
} from "../dist/features/board/internal/model/interaction.js";

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

test("computes reusable now indicator position for the rendered current date", () => {
  const now = new Date(2026, 4, 6, 9, 30);

  assert.equal(localIsoDateFromDate(now), "2026-05-06");
  assert.equal(minuteOfDayFromDate(now), 570);
  assert.deepEqual(
    buildNowIndicatorForDate({
      dateIso: "2026-05-06",
      visibleStartMinute: 480,
      visibleEndMinute: 1080,
      now,
    }),
    {
      minuteOfDay: 570,
      topPercent: 15,
    }
  );
});

test("does not render now indicator for another date or outside visible time", () => {
  const now = new Date(2026, 4, 6, 9, 30);

  assert.equal(
    buildNowIndicatorForDate({
      dateIso: "2026-05-07",
      visibleStartMinute: 480,
      visibleEndMinute: 1080,
      now,
    }),
    null
  );
  assert.equal(
    buildNowIndicatorForDate({
      dateIso: "2026-05-06",
      visibleStartMinute: 600,
      visibleEndMinute: 1080,
      now,
    }),
    null
  );
});

test("wraps now indicator position with a week day index", () => {
  const now = new Date(2026, 4, 6, 9, 30);

  assert.deepEqual(
    buildNowIndicatorForWeek({
      weekStartIso: "2026-05-04",
      visibleStartMinute: 480,
      visibleEndMinute: 1080,
      now,
    }),
    {
      minuteOfDay: 570,
      topPercent: 15,
      dayIndex: 2,
    }
  );
  assert.equal(
    buildNowIndicatorForWeek({
      weekStartIso: "2026-05-11",
      visibleStartMinute: 480,
      visibleEndMinute: 1080,
      now,
    }),
    null
  );
});

test("computes refresh delay until next minute boundary", () => {
  assert.equal(
    millisecondsUntilNextMinute(new Date(2026, 4, 6, 9, 30, 0, 0)),
    60000
  );
  assert.equal(
    millisecondsUntilNextMinute(new Date(2026, 4, 6, 9, 30, 12, 250)),
    47750
  );
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

test("computes empty-cell payload from drag range", () => {
  const payload = toEmptyCellClickPayload({
    dayIndex: 1,
    clientX: 300,
    clientY: 500,
    top: 200,
    height: 500,
    visibleStartMinute: 480,
    totalVisibleMinutes: 600,
    columnRect: {
      left: 280,
      top: 200,
      width: 160,
      height: 500,
    },
    draftStartMinute: 615,
    draftEndMinute: 705,
  });

  assert.deepEqual(payload, {
    dayIndex: 1,
    minuteOfDay: 615,
    startMinute: 615,
    endMinute: 705,
    clientX: 300,
    clientY: 500,
    columnRect: {
      left: 280,
      top: 200,
      width: 160,
      height: 500,
    },
  });
});

test("maps blackout windows and groups them by day", () => {
  const layout = {
    week_start: "2026-05-04",
    week_end: "2026-05-11",
    slots: [],
    appointments: [],
    blackout_windows: [
      {
        blackout_id: "bo-1",
        day_index: 2,
        start_minute: 540,
        end_minute: 600,
        clipped_start: false,
        clipped_end: false,
      },
    ],
  };

  assert.deepEqual(mapBlackoutWindows(layout), [
    {
      id: "bo-1",
      dayIndex: 2,
      startMinute: 540,
      endMinute: 600,
    },
  ]);
});
