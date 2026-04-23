import assert from "node:assert/strict";
import test from "node:test";
import {
  createCommandEnvelope,
  executeCommand,
  executeWeeklyLayoutQuery,
} from "../dist/client.js";
import { COMMANDS } from "../dist/types.js";

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
    assignee_id: "doctor-42",
    visible_start_minute: 540,
    visible_end_minute: 1020,
  });

  assert.equal(response.status, "success");
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
