import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAddAppointmentCommand,
  buildAddSlotCommand,
  buildCancelAppointmentCommand,
  buildCancelSlotCommand,
  buildDeleteAppointmentCommand,
  buildDeleteSlotCommand,
  buildRescheduleSlotCommand,
} from "../dist/interactive/command-mode.js";

const options = {
  createdBy: "ui-operator",
  appointmentIdFactory: (slotId) => `appt-for-${slotId}`,
  bookAppointmentInviteeIds: ["participant-demo"],
  bookAppointmentTitle: "Consultation",
  bookAppointmentCreatedBy: "",
  cancelAppointmentBy: "",
  weekStartIso: "2026-05-05",
};

test("maps create-slot payload to add_slot command envelope", () => {
  const command = buildAddSlotCommand({
    slotId: "slot-1",
    startIso: "2026-05-07T09:00:00Z",
    endIso: "2026-05-07T09:30:00Z",
    resourceOwnerId: "owner-42",
    createdBy: "ui-operator",
  });

  assert.deepEqual(command, {
    command: "add_slot",
    payload: {
      slot_id: "slot-1",
      start: "2026-05-07T09:00:00Z",
      end: "2026-05-07T09:30:00Z",
      resource_owner_id: "owner-42",
      created_by: "ui-operator",
    },
  });
});

test("maps book-slot payload to add_appointment command envelope", () => {
  const command = buildAddAppointmentCommand({ slotId: "slot-2" }, options);

  assert.deepEqual(command, {
    command: "add_appointment",
    payload: {
      appointment_id: "appt-for-slot-2",
      slot_id: "slot-2",
      invitee_ids: ["participant-demo"],
      title: "Consultation",
      created_by: "ui-operator",
    },
  });
});

test("maps slot cancellation/deletion payloads to stable slot commands", () => {
  assert.deepEqual(buildCancelSlotCommand({ slotId: "slot-3" }), {
    command: "cancel_slot",
    payload: { slot_id: "slot-3" },
  });

  assert.deepEqual(buildDeleteSlotCommand({ slotId: "slot-3" }), {
    command: "delete_slot",
    payload: { slot_id: "slot-3" },
  });
});

test("maps slot reschedule payload to reschedule_slot command envelope", () => {
  const command = buildRescheduleSlotCommand(
    {
      slotId: "slot-5",
      dayIndex: 2,
      startMinute: 555,
      endMinute: 615,
    },
    options
  );

  assert.deepEqual(command, {
    command: "reschedule_slot",
    payload: {
      slot_id: "slot-5",
      new_start: "2026-05-07T09:15:00.000Z",
      new_end: "2026-05-07T10:15:00.000Z",
      updated_by: "ui-operator",
    },
  });
});

test("maps appointment cancellation/deletion payloads to stable appointment commands", () => {
  const cancelCommand = buildCancelAppointmentCommand(
    { appointmentId: "appt-7" },
    {
      ...options,
      cancelAppointmentBy: "nurse-9",
    }
  );
  assert.deepEqual(cancelCommand, {
    command: "cancel_appointment",
    payload: {
      appointment_id: "appt-7",
      cancelled_by: "nurse-9",
    },
  });

  const deleteCommand = buildDeleteAppointmentCommand({ appointmentId: "appt-7" });
  assert.deepEqual(deleteCommand, {
    command: "delete_appointment",
    payload: {
      appointment_id: "appt-7",
    },
  });
});
