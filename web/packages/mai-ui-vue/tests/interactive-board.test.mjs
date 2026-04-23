import assert from "node:assert/strict";
import test from "node:test";

import {
  INTERACTION_ACTIONS,
  INTERACTION_SUCCESS_EVENTS,
} from "../dist/types/interactive.js";
import {
  applyEmptyCellClick,
  clearSelectionState,
  overlayKindForSelection,
  runInteractionAction,
  withAppointmentSelected,
  withEmptyCellDraft,
  withSlotSelected,
} from "../dist/interactive/state.js";

test("empty cell click opens create-slot popover", () => {
  const next = withEmptyCellDraft({
    dayIndex: 2,
    minuteOfDay: 540,
    clientX: 120,
    clientY: 240,
  });

  assert.equal(overlayKindForSelection(next), "create-slot");
});

test("empty cell second click on same cell closes create-slot popover", () => {
  const firstClick = {
    dayIndex: 2,
    minuteOfDay: 540,
    clientX: 120,
    clientY: 240,
  };
  const opened = withEmptyCellDraft(firstClick);
  const toggled = applyEmptyCellClick(opened, {
    ...firstClick,
    clientX: 121,
    clientY: 241,
  });

  assert.equal(overlayKindForSelection(toggled), "none");
});

test("empty cell click on different target retargets draft", () => {
  const opened = withEmptyCellDraft({
    dayIndex: 2,
    minuteOfDay: 540,
    clientX: 120,
    clientY: 240,
  });
  const switched = applyEmptyCellClick(opened, {
    dayIndex: 2,
    minuteOfDay: 555,
    clientX: 140,
    clientY: 260,
  });

  assert.equal(overlayKindForSelection(switched), "create-slot");
  assert.deepEqual(switched.pendingSlotDraft, {
    dayIndex: 2,
    minuteOfDay: 555,
    clientX: 140,
    clientY: 260,
  });
});

test("slot click opens slot actions popover", () => {
  const next = withSlotSelected({
    slotId: "slot-1",
    dayIndex: 1,
    startMinute: 600,
    endMinute: 660,
    clientX: 200,
    clientY: 300,
  });

  assert.equal(overlayKindForSelection(next), "slot-actions");
});

test("appointment click opens appointment actions popover", () => {
  const next = withAppointmentSelected({
    appointmentId: "appt-1",
    slotId: "slot-1",
    dayIndex: 1,
    startMinute: 600,
    endMinute: 660,
    clientX: 220,
    clientY: 320,
  });

  assert.equal(overlayKindForSelection(next), "appointment-actions");
});

test("successful actions clear selection and emit expected success event", async () => {
  const selectedState = withSlotSelected({
    slotId: "slot-1",
    dayIndex: 1,
    startMinute: 600,
    endMinute: 660,
    clientX: 210,
    clientY: 340,
  });
  const payload = { slotId: "slot-1" };

  const result = await runInteractionAction({
    action: INTERACTION_ACTIONS.BOOK_SLOT,
    successEvent: INTERACTION_SUCCESS_EVENTS.SLOT_BOOKED,
    payload,
    handler: async () => true,
    state: selectedState,
  });

  assert.equal(result.emittedEvent, INTERACTION_SUCCESS_EVENTS.SLOT_BOOKED);
  assert.deepEqual(result.emittedPayload, payload);
  assert.deepEqual(result.nextState, clearSelectionState());
});

test("failed actions emit deterministic interaction-error payload", async () => {
  const selectedState = withAppointmentSelected({
    appointmentId: "appt-1",
    slotId: "slot-1",
    dayIndex: 1,
    startMinute: 600,
    endMinute: 660,
    clientX: 220,
    clientY: 320,
  });
  const payload = { appointmentId: "appt-1" };

  const rejected = await runInteractionAction({
    action: INTERACTION_ACTIONS.CANCEL_APPOINTMENT,
    successEvent: INTERACTION_SUCCESS_EVENTS.APPOINTMENT_CANCELLED,
    payload,
    handler: async () => false,
    state: selectedState,
  });
  assert.equal(rejected.emittedEvent, "interaction-error");
  assert.deepEqual(rejected.emittedPayload, {
    action: INTERACTION_ACTIONS.CANCEL_APPOINTMENT,
    message: "action rejected",
  });
  assert.deepEqual(rejected.nextState, selectedState);

  const thrown = await runInteractionAction({
    action: INTERACTION_ACTIONS.CANCEL_APPOINTMENT,
    successEvent: INTERACTION_SUCCESS_EVENTS.APPOINTMENT_CANCELLED,
    payload,
    handler: async () => {
      throw new Error("backend unavailable");
    },
    state: selectedState,
  });
  assert.equal(thrown.emittedEvent, "interaction-error");
  assert.deepEqual(thrown.emittedPayload, {
    action: INTERACTION_ACTIONS.CANCEL_APPOINTMENT,
    message: "backend unavailable",
  });
});
