import assert from "node:assert/strict";
import test from "node:test";

import {
  beginBookingConfirmation,
  canSubmitBooking,
  completeBookingAuth,
  initialBookingFlowState,
  markAvailabilityRefreshing,
  markBookingConfirmed,
  selectBookingSlot,
  selectBookingSpecialty,
  selectCompatibleBookingDoctor,
} from "../dist/booking/state.js";

test("specialty selection opens slot selection and clears doctor and slot", () => {
  const state = {
    ...initialBookingFlowState(),
    selectedDoctorId: "doctor-1",
    selectedSlot: {
      slotId: "slot-1",
      dayIndex: 1,
      startMinute: 540,
      endMinute: 570,
    },
  };

  const next = selectBookingSpecialty(state, "dermatology");

  assert.equal(next.step, "select-slot");
  assert.equal(next.selectedSpecialtyId, "dermatology");
  assert.equal(next.selectedDoctorId, null);
  assert.equal(next.selectedSlot, null);
});

test("doctor selection is optional and rejects incompatible doctors", () => {
  const state = selectBookingSpecialty(
    initialBookingFlowState(),
    "dermatology"
  );

  const incompatible = selectCompatibleBookingDoctor(state, {
    doctorId: "doctor-1",
    displayName: "Dr Martin",
    specialtyIds: ["cardiology"],
    resourceOwnerId: "owner-1",
  });
  const compatible = selectCompatibleBookingDoctor(state, {
    doctorId: "doctor-2",
    displayName: "Dr Simon",
    specialtyIds: ["dermatology"],
    resourceOwnerId: "owner-2",
  });

  assert.equal(incompatible.selectedDoctorId, null);
  assert.equal(compatible.selectedDoctorId, "doctor-2");
});

test("booking cannot submit until specialty slot and invitee are available", () => {
  let state = initialBookingFlowState();
  assert.equal(canSubmitBooking(state), false);

  state = selectBookingSpecialty(state, "dermatology");
  state = selectBookingSlot(state, {
    slotId: "slot-1",
    dayIndex: 1,
    startMinute: 540,
    endMinute: 570,
  });
  assert.equal(canSubmitBooking(state), false);

  state = completeBookingAuth(state, {
    inviteeId: "patient-1",
    userDisplayName: "Camille Martin",
  });
  assert.equal(canSubmitBooking(state), true);
});

test("confirmation requires auth before submitting", () => {
  const state = selectBookingSlot(
    selectBookingSpecialty(initialBookingFlowState(), "dermatology"),
    {
      slotId: "slot-1",
      dayIndex: 1,
      startMinute: 540,
      endMinute: 570,
    }
  );

  assert.equal(beginBookingConfirmation(state).step, "auth-required");
  assert.equal(
    beginBookingConfirmation(
      completeBookingAuth(state, {
        inviteeId: "patient-1",
        userDisplayName: "Camille Martin",
      })
    ).step,
    "submitting"
  );
});

test("successful booking refreshes availability before confirmed state", () => {
  const state = completeBookingAuth(
    selectBookingSlot(
      selectBookingSpecialty(initialBookingFlowState(), "dermatology"),
      {
        slotId: "slot-1",
        dayIndex: 1,
        startMinute: 540,
        endMinute: 570,
      }
    ),
    {
      inviteeId: "patient-1",
      userDisplayName: "Camille Martin",
    }
  );

  const submitting = beginBookingConfirmation(state);
  const refreshing = markAvailabilityRefreshing(submitting);
  const confirmed = markBookingConfirmed(refreshing);

  assert.equal(submitting.step, "submitting");
  assert.equal(refreshing.step, "refreshing");
  assert.equal(confirmed.step, "confirmed");
  assert.equal(confirmed.selectedSlot, null);
});
