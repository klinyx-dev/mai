import assert from "node:assert/strict";
import test from "node:test";

import { isMaiViewFilter } from "../dist/validators/events.js";

test("isMaiViewFilter accepts canonical all/none/owners/group shapes", () => {
  assert.equal(isMaiViewFilter({ mode: "all" }), true);
  assert.equal(isMaiViewFilter({ mode: "none" }), true);
  assert.equal(isMaiViewFilter({ mode: "owners", ids: ["owner-1"] }), true);
  assert.equal(isMaiViewFilter({ mode: "group", ids: ["team-a"] }), true);
});

test("isMaiViewFilter rejects invalid filter payloads", () => {
  assert.equal(isMaiViewFilter({ mode: "owners" }), false);
  assert.equal(isMaiViewFilter({ mode: "owners", ids: [42] }), false);
  assert.equal(isMaiViewFilter({ mode: "all", ids: ["owner-1"] }), true);
  assert.equal(isMaiViewFilter({ mode: "unknown", ids: [] }), false);
});
