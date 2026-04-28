import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { MaiDoctorPicker } from "../dist/booking/MaiDoctorPicker.js";
import { MaiSpecialtyPicker } from "../dist/booking/MaiSpecialtyPicker.js";
import { eligibleDoctorsForSpecialty } from "../dist/booking/options.js";

const distStyles = readFileSync(
  new URL("../dist/styles.css", import.meta.url),
  "utf8"
);

test("specialty and doctor pickers expose deterministic event contracts", () => {
  assert.equal(MaiSpecialtyPicker.name, "MaiSpecialtyPicker");
  assert.equal(MaiDoctorPicker.name, "MaiDoctorPicker");
  assert.equal(
    MaiSpecialtyPicker.emits.specialtySelected("dermatology"),
    true
  );
  assert.equal(MaiSpecialtyPicker.emits.specialtySelected(""), false);
  assert.equal(MaiDoctorPicker.emits.doctorSelected(null), true);
  assert.equal(MaiDoctorPicker.emits.doctorSelected("doctor-1"), true);
});

test("eligibleDoctorsForSpecialty returns only matching doctors", () => {
  const doctors = [
    {
      doctorId: "doctor-1",
      displayName: "Dr Martin",
      specialtyIds: ["dermatology"],
      resourceOwnerId: "owner-1",
    },
    {
      doctorId: "doctor-2",
      displayName: "Dr Simon",
      specialtyIds: ["cardiology"],
      resourceOwnerId: "owner-2",
    },
  ];

  assert.deepEqual(
    eligibleDoctorsForSpecialty(doctors, "dermatology").map(
      (doctor) => doctor.doctorId
    ),
    ["doctor-1"]
  );
  assert.deepEqual(eligibleDoctorsForSpecialty(doctors, null), []);
});

test("booking option styles use design tokens and avoid gradients", () => {
  assert.match(distStyles, /\.mai-booking-option/);
  assert.match(distStyles, /var\(--color-border\)/);
  assert.match(distStyles, /var\(--radius-md\)/);
  assert.match(distStyles, /focus-visible/);
  assert.doesNotMatch(distStyles, /gradient/i);
});
