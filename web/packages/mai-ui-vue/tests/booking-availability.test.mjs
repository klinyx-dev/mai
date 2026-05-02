import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { MaiAvailabilityPicker } from "../dist/booking/MaiAvailabilityPicker.js";
import {
  availabilitySlotsForDay,
  availabilitySlotsFromWeeklyLayout,
  dedupeAvailabilitySlotsByStartMinute,
  filterAvailabilitySlotsByVisibility,
  isBookableSlotStatus,
  sortAvailabilitySlots,
} from "../dist/booking/availability.js";

const distStyles = readFileSync(
  new URL("../dist/styles.css", import.meta.url),
  "utf8"
);

test("availability mapper projects weekly layout slots deterministically", () => {
  const slots = availabilitySlotsFromWeeklyLayout(
    {
      week_start: "2026-05-04",
      week_end: "2026-05-11",
      slots: [
        {
          slot_id: "slot-b",
          day_index: 2,
          start_minute: 600,
          end_minute: 630,
          clipped_start: false,
          clipped_end: false,
        },
        {
          slot_id: "slot-a",
          day_index: 1,
          start_minute: 540,
          end_minute: 570,
          clipped_start: false,
          clipped_end: false,
        },
      ],
      appointments: [],
    },
    {
      "slot-a": {
        resourceOwnerId: "owner-1",
        resourceId: "resource-1",
        resourceLabel: "Resource One",
      },
    }
  );

  assert.deepEqual(
    slots.map((slot) => slot.slotId),
    ["slot-a", "slot-b"]
  );
  assert.equal(slots[0].resourceLabel, "Resource One");
});

test("availability slots are sorted and grouped by day", () => {
  const slots = sortAvailabilitySlots([
    { slotId: "slot-2", dayIndex: 1, startMinute: 600, endMinute: 630 },
    { slotId: "slot-1", dayIndex: 1, startMinute: 540, endMinute: 570 },
    { slotId: "slot-3", dayIndex: 2, startMinute: 540, endMinute: 570 },
  ]);

  assert.deepEqual(
    slots.map((slot) => slot.slotId),
    ["slot-1", "slot-2", "slot-3"]
  );
  assert.deepEqual(
    availabilitySlotsForDay(slots, 1).map((slot) => slot.slotId),
    ["slot-1", "slot-2"]
  );
});

test("availability visibility and dedupe helpers prefer bookable slots", () => {
  const slots = [
    {
      slotId: "slot-booked",
      dayIndex: 1,
      startMinute: 540,
      endMinute: 570,
      status: "booked",
    },
    {
      slotId: "slot-open",
      dayIndex: 1,
      startMinute: 540,
      endMinute: 570,
      status: "available",
    },
    {
      slotId: "slot-cancelled",
      dayIndex: 1,
      startMinute: 600,
      endMinute: 630,
      status: "cancelled",
    },
  ];

  assert.equal(isBookableSlotStatus("available"), true);
  assert.equal(isBookableSlotStatus("booked"), false);
  assert.deepEqual(
    filterAvailabilitySlotsByVisibility(slots, "available-only").map(
      (slot) => slot.slotId
    ),
    ["slot-open"]
  );
  assert.deepEqual(
    dedupeAvailabilitySlotsByStartMinute(slots).map((slot) => slot.slotId),
    ["slot-open", "slot-cancelled"]
  );
});

test("availability picker exposes deterministic event contracts", () => {
  assert.equal(MaiAvailabilityPicker.name, "MaiAvailabilityPicker");
  assert.equal(MaiAvailabilityPicker.emits.navigateWeek(-1), true);
  assert.equal(MaiAvailabilityPicker.emits.navigateWeek(2), false);
  assert.equal(
    MaiAvailabilityPicker.emits.slotSelected({
      slotId: "slot-1",
      dayIndex: 1,
      startMinute: 540,
      endMinute: 570,
    }),
    true
  );
});

test("availability styles follow scheduler design rules", () => {
  assert.match(distStyles, /\.mai-booking-days/);
  assert.match(distStyles, /\.mai-booking-slot/);
  assert.match(distStyles, /border:\s*1px solid rgba\(15,\s*118,\s*110,\s*0\.24\)/);
  assert.match(distStyles, /font-variant-numeric:\s*tabular-nums/);
  assert.match(distStyles, /var\(--color-border-subtle\)/);
  assert.doesNotMatch(distStyles, /glass/i);
  assert.doesNotMatch(distStyles, /gradient/i);
});
