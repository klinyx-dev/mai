import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { MaiBookingFlow } from "../dist/features/booking/MaiBookingFlow.js";

const distEntry = readFileSync(
  new URL("../dist/index.js", import.meta.url),
  "utf8"
);
const distTypes = readFileSync(
  new URL("../dist/index.d.ts", import.meta.url),
  "utf8"
);
const distStyles = readFileSync(
  new URL("../dist/styles.css", import.meta.url),
  "utf8"
);

test("booking flow exposes deterministic event contracts", () => {
  assert.equal(MaiBookingFlow.name, "MaiBookingFlow");
  assert.equal(MaiBookingFlow.emits.navigateWeek(-1), true);
  assert.equal(MaiBookingFlow.emits.locationSelected("location-1"), true);
  assert.equal(MaiBookingFlow.emits.categorySelected("category-a"), true);
  assert.equal(MaiBookingFlow.emits.resourceSelected(null), true);
  assert.equal(
    MaiBookingFlow.emits["update:modelValue"]({
      step: "select-category",
    }),
    true
  );
  assert.equal(
    MaiBookingFlow.emits.slotSelected({
      slotId: "slot-1",
      dayIndex: 1,
      startMinute: 540,
      endMinute: 570,
    }),
    true
  );
  assert.equal(
    MaiBookingFlow.emits.authCompleted({
      inviteeId: "participant-1",
      userDisplayName: "Alex Martin",
    }),
    true
  );
  assert.equal(
    MaiBookingFlow.emits.bookingError({
      action: "confirm-booking",
      message: "booking failed",
    }),
    true
  );
  assert.equal(
    MaiBookingFlow.emits.bookingSubmitted({
      appointmentId: "appt-1",
      slotId: "slot-1",
      inviteeId: "participant-1",
      createdBy: "participant-1",
      userDisplayName: "Alex Martin",
      reason: "Category A",
      title: "Alex Martin - Category A",
      categoryId: "category-a",
    }),
    true
  );
  assert.equal(
    MaiBookingFlow.emits.bookingSubmitted({
      slotId: "slot-1",
    }),
    false
  );
});

test("booking flow is exported from the public package entrypoint", () => {
  assert.match(distEntry, /export \{ MaiBookingFlow/);
  assert.match(distEntry, /MaiAvailabilityPicker/);
  assert.match(distEntry, /MaiCategoryPicker/);
  assert.match(distEntry, /MaiResourcePicker/);
  assert.match(distTypes, /MaiBookingActionConfig/);
  assert.match(distTypes, /MaiBookSlotPayload/);
  assert.match(distTypes, /MaiBookingResource/);
});

test("booking flow styles follow design-system constraints", () => {
  assert.match(distStyles, /\.mai-booking-flow/);
  assert.match(distStyles, /var\(--space-6\)/);
  assert.doesNotMatch(distStyles, /gradient/i);
  assert.doesNotMatch(distStyles, /glass/i);
});
