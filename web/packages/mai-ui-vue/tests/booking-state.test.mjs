import assert from "node:assert/strict";
import test from "node:test";

import {
  beginBookingConfirmation,
  canSubmitBooking,
  completeBookingAuth,
  initialBookingFlowState,
  markAvailabilityRefreshing,
  markBookingConfirmed,
  selectBookingCategory,
  selectBookingLocation,
  selectBookingResource,
  selectBookingSlot,
  selectCompatibleBookingResource,
  setBookingNotes,
} from "../dist/booking/state.js";

test("location and category selection clear dependent booking state", () => {
  const state = {
    ...initialBookingFlowState(),
    selectedResourceId: "resource-1",
    selectedSlot: {
      slotId: "slot-1",
      dayIndex: 1,
      startMinute: 540,
      endMinute: 570,
    },
  };

  const location = selectBookingLocation(state, "location-1");
  const next = selectBookingCategory(location, "category-a");

  assert.equal(location.step, "select-category");
  assert.equal(location.selectedLocationId, "location-1");
  assert.equal(location.selectedSlot, null);
  assert.equal(next.step, "select-slot");
  assert.equal(next.selectedCategoryId, "category-a");
  assert.equal(next.selectedResourceId, null);
  assert.equal(next.selectedSlot, null);
});

test("resource selection is optional and rejects incompatible resources", () => {
  const state = selectBookingCategory(initialBookingFlowState(), "category-a");

  const incompatible = selectCompatibleBookingResource(state, {
    resourceId: "resource-1",
    label: "Resource One",
    categoryIds: ["category-b"],
    resourceOwnerId: "owner-1",
  });
  const compatible = selectCompatibleBookingResource(state, {
    resourceId: "resource-2",
    label: "Resource Two",
    categoryIds: ["category-a"],
    resourceOwnerId: "owner-2",
  });
  const optional = selectBookingResource(state, null);

  assert.equal(incompatible.selectedResourceId, null);
  assert.equal(compatible.selectedResourceId, "resource-2");
  assert.equal(optional.selectedResourceId, null);
});

test("booking cannot submit until category slot and invitee are available", () => {
  let state = initialBookingFlowState();
  assert.equal(canSubmitBooking(state), false);

  state = selectBookingCategory(state, "category-a");
  state = selectBookingSlot(state, {
    slotId: "slot-1",
    dayIndex: 1,
    startMinute: 540,
    endMinute: 570,
  });
  state = setBookingNotes(state, "Needs accessibility support");
  assert.equal(canSubmitBooking(state), false);
  assert.equal(state.notes, "Needs accessibility support");

  state = completeBookingAuth(state, {
    inviteeId: "participant-1",
    userDisplayName: "Alex Martin",
  });
  assert.equal(canSubmitBooking(state), true);
});

test("confirmation requires auth before submitting", () => {
  const state = selectBookingSlot(
    selectBookingCategory(initialBookingFlowState(), "category-a"),
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
        inviteeId: "participant-1",
        userDisplayName: "Alex Martin",
      })
    ).step,
    "submitting"
  );
});

test("successful booking refreshes availability before confirmed state", () => {
  const state = completeBookingAuth(
    selectBookingSlot(
      selectBookingCategory(initialBookingFlowState(), "category-a"),
      {
        slotId: "slot-1",
        dayIndex: 1,
        startMinute: 540,
        endMinute: 570,
      }
    ),
    {
      inviteeId: "participant-1",
      userDisplayName: "Alex Martin",
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
