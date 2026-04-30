import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAppointmentTitle,
  createBookSlotCommand,
  createCommandEnvelope,
  createQueryEnvelope,
  executeCommand,
  executeWeeklyLayoutQuery,
} from "../dist/client.js";
import { COMMANDS, QUERIES } from "../dist/types.js";

test("executeWeeklyLayoutQuery returns parsed success payload", () => {
  const adapter = {
    execute_command_json: () => '{"status":"success","data":"applied"}',
    execute_query_json: () =>
      JSON.stringify({
        status: "success",
        data: {
          week_start: "2026-05-04",
          week_end: "2026-05-11",
          slots: [],
          appointments: [],
        },
      }),
  };

  const response = executeWeeklyLayoutQuery(adapter, {
    anchor_date: "2026-05-07",
    view_filter: {
      mode: "owners",
      ids: ["owner-42"],
    },
    visible_start_minute: 540,
    visible_end_minute: 1020,
  });

  assert.equal(response.status, "success");
});

test("executeWeeklyLayoutQuery serializes none filter mode", () => {
  let captured = "";
  const adapter = {
    execute_command_json: () => '{"status":"success","data":"applied"}',
    execute_query_json: (input) => {
      captured = input;
      return JSON.stringify({
        status: "success",
        data: {
          week_start: "2026-05-04",
          week_end: "2026-05-11",
          slots: [],
          appointments: [],
        },
      });
    },
  };

  const response = executeWeeklyLayoutQuery(adapter, {
    anchor_date: "2026-05-07",
    view_filter: { mode: "none" },
  });

  assert.equal(response.status, "success");
  const parsed = JSON.parse(captured);
  assert.equal(parsed.payload.view_filter.mode, "none");
});

test("executeWeeklyLayoutQuery keeps empty owner IDs payload deterministic", () => {
  let captured = "";
  const adapter = {
    execute_command_json: () => '{"status":"success","data":"applied"}',
    execute_query_json: (input) => {
      captured = input;
      return JSON.stringify({
        status: "success",
        data: {
          week_start: "2026-05-04",
          week_end: "2026-05-11",
          slots: [],
          appointments: [],
        },
      });
    },
  };

  const response = executeWeeklyLayoutQuery(adapter, {
    anchor_date: "2026-05-07",
    view_filter: { mode: "owners", ids: [] },
  });

  assert.equal(response.status, "success");
  const parsed = JSON.parse(captured);
  assert.deepEqual(parsed.payload.view_filter, { mode: "owners", ids: [] });
});

test("executeCommand sends command envelope and parses success payload", () => {
  let captured = "";
  const adapter = {
    execute_command_json: (input) => {
      captured = input;
      return '{"status":"success","data":"applied"}';
    },
    execute_query_json: () => '{"status":"success","data":{"week_start":"","week_end":"","slots":[],"appointments":[]}}',
  };

  const command = createCommandEnvelope(COMMANDS.DELETE_SLOT, {
    slot_id: "slot-1",
  });
  const response = executeCommand(adapter, command);

  assert.equal(response.status, "success");
  const parsed = JSON.parse(captured);
  assert.equal(parsed.command, "delete_slot");
  assert.equal(parsed.payload.slot_id, "slot-1");
});

test("createCommandEnvelope supports new cancel appointment command", () => {
  const command = createCommandEnvelope(COMMANDS.CANCEL_APPOINTMENT, {
    appointment_id: "appt-1",
    cancelled_by: "ui-operator",
  });

  assert.deepEqual(command, {
    command: "cancel_appointment",
    payload: {
      appointment_id: "appt-1",
      cancelled_by: "ui-operator",
    },
  });
});

test("buildAppointmentTitle combines user display name and reason", () => {
  assert.equal(
    buildAppointmentTitle({
      userDisplayName: "  Camille Martin ",
      reason: " Dermatology consultation ",
    }),
    "Camille Martin - Dermatology consultation"
  );
});

test("createBookSlotCommand maps one invitee into add appointment payload", () => {
  const command = createBookSlotCommand({
    appointmentId: "appt-1",
    slotId: "slot-1",
    inviteeId: "patient-1",
    createdBy: "patient-1",
    userDisplayName: "Camille Martin",
    reason: "Dermatology consultation",
  });

  assert.deepEqual(command, {
    command: "add_appointment",
    payload: {
      appointment_id: "appt-1",
      slot_id: "slot-1",
      invitee_ids: ["patient-1"],
      title: "Camille Martin - Dermatology consultation",
      created_by: "patient-1",
    },
  });
});

test("createCommandEnvelope supports slot reschedule command", () => {
  const command = createCommandEnvelope(COMMANDS.RESCHEDULE_SLOT, {
    slot_id: "slot-1",
    new_start: "2026-05-07T09:00:00Z",
    new_end: "2026-05-07T09:45:00Z",
    updated_by: "ui-operator",
  });

  assert.deepEqual(command, {
    command: "reschedule_slot",
    payload: {
      slot_id: "slot-1",
      new_start: "2026-05-07T09:00:00Z",
      new_end: "2026-05-07T09:45:00Z",
      updated_by: "ui-operator",
    },
  });
});

test("createQueryEnvelope uses centralized query constants", () => {
  const query = createQueryEnvelope(QUERIES.WEEKLY_LAYOUT, {
    anchor_date: "2026-05-07",
  });

  assert.deepEqual(query, {
    query: "weekly_layout",
    payload: {
      anchor_date: "2026-05-07",
    },
  });
});

test("createQueryEnvelope accepts explicit none and group filter payloads", () => {
  const noneQuery = createQueryEnvelope(QUERIES.WEEKLY_LAYOUT, {
    anchor_date: "2026-05-07",
    view_filter: { mode: "none" },
  });
  const groupQuery = createQueryEnvelope(QUERIES.WEEKLY_LAYOUT, {
    anchor_date: "2026-05-07",
    view_filter: { mode: "group", ids: ["team-a"] },
  });

  assert.deepEqual(noneQuery.payload.view_filter, { mode: "none" });
  assert.deepEqual(groupQuery.payload.view_filter, {
    mode: "group",
    ids: ["team-a"],
  });
});
