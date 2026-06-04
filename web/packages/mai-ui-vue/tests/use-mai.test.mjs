import assert from "node:assert/strict";
import test from "node:test";

import { useMai } from "../dist/useMai.js";

const successCommand = {
  command: "delete_slot",
  payload: {
    slot_id: "slot-1",
  },
};

function layoutFor(anchorDate) {
  return {
    week_start: anchorDate,
    week_end: "2026-05-11",
    slots: [],
    appointments: [],
  };
}

test("mutateAndRefresh executes a command then refreshes authoritative layout", async () => {
  const commandInputs = [];
  const queryInputs = [];
  const adapter = {
    execute_command_json: (input) => {
      commandInputs.push(JSON.parse(input));
      return '{"status":"success","data":"applied"}';
    },
    execute_query_json: (input) => {
      const parsed = JSON.parse(input);
      queryInputs.push(parsed);
      return JSON.stringify({
        status: "success",
        data: layoutFor(parsed.payload.anchor_date),
      });
    },
  };
  const mai = useMai({ adapter });
  const query = {
    anchor_date: "2026-05-07",
    view_filter: { mode: "owners", ids: ["owner-42"] },
  };

  const ok = await mai.mutateAndRefresh(successCommand, query);

  assert.equal(ok, true);
  assert.deepEqual(commandInputs, [successCommand]);
  assert.deepEqual(queryInputs, [{ query: "weekly_layout", payload: query }]);
  assert.equal(mai.layout.value?.week_start, "2026-05-07");
  assert.equal(mai.error.value, null);
  assert.equal(mai.loading.value, false);
});

test("mutateAndRefresh does not refresh after a failed mutation", async () => {
  let queryCount = 0;
  const adapter = {
    execute_command_json: () =>
      JSON.stringify({
        status: "error",
        error: {
          category: "business",
          code: "slot_not_available",
          message: "slot is not available",
        },
      }),
    execute_query_json: () => {
      queryCount += 1;
      return JSON.stringify({ status: "success", data: layoutFor("2026-05-07") });
    },
  };
  const mai = useMai({ adapter });

  const ok = await mai.mutateAndRefresh(successCommand, {
    anchor_date: "2026-05-07",
  });

  assert.equal(ok, false);
  assert.equal(queryCount, 0);
  assert.equal(mai.layout.value, null);
  assert.equal(mai.error.value, "slot_not_available: slot is not available");
});

test("refresh ignores stale responses when a newer refresh starts first", async () => {
  let mai;
  const adapter = {
    execute_command_json: () => '{"status":"success","data":"applied"}',
    execute_query_json: (input) => {
      const parsed = JSON.parse(input);
      if (parsed.payload.anchor_date === "2026-05-07") {
        void mai.refresh({ anchor_date: "2026-05-14" });
      }
      return JSON.stringify({
        status: "success",
        data: layoutFor(parsed.payload.anchor_date),
      });
    },
  };
  mai = useMai({ adapter });

  await mai.refresh({ anchor_date: "2026-05-07" });

  assert.equal(mai.layout.value?.week_start, "2026-05-14");
  assert.equal(mai.error.value, null);
  assert.equal(mai.loading.value, false);
});
