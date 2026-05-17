import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { buildAppointmentTitle } from "@mai/mai-web-core";
import { MaiBookingAuthGate } from "../dist/features/booking/ui/MaiBookingAuthGate.js";
import { MaiBookingConfirmCard } from "../dist/features/booking/ui/MaiBookingConfirmCard.js";

const distStyles = readFileSync(
  new URL("../dist/styles.css", import.meta.url),
  "utf8"
);

test("auth gate and confirmation card expose deterministic events", () => {
  assert.equal(MaiBookingAuthGate.name, "MaiBookingAuthGate");
  assert.equal(MaiBookingConfirmCard.name, "MaiBookingConfirmCard");
  assert.equal(MaiBookingAuthGate.emits.requestAuth(), true);
  assert.equal(MaiBookingConfirmCard.emits.confirm(), true);
  assert.equal(MaiBookingConfirmCard.emits.back(), true);
});

test("appointment title uses user display name plus reason", () => {
  assert.equal(
    buildAppointmentTitle({
      userDisplayName: "Camille Martin",
      reason: "Dermatology consultation",
    }),
    "Camille Martin - Dermatology consultation"
  );
});

test("confirmation styles use card and button design tokens", () => {
  assert.match(distStyles, /\.mai-booking-card/);
  assert.match(distStyles, /\.mai-booking-button/);
  assert.match(distStyles, /var\(--shadow-ring\)/);
  assert.match(distStyles, /focus-visible/);
  assert.doesNotMatch(distStyles, /gradient/i);
  assert.doesNotMatch(distStyles, /glass/i);
});
