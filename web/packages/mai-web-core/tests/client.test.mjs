import assert from "node:assert/strict";
import test from "node:test";
import { executeWeeklyLayoutQuery } from "../dist/index.js";

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
