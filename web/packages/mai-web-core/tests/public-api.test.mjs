import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const distEntry = readFileSync(
  new URL("../dist/index.js", import.meta.url),
  "utf8"
);
const distTypes = readFileSync(
  new URL("../dist/index.d.ts", import.meta.url),
  "utf8"
);

test("exports documented command and query constants", () => {
  assert.match(distEntry, /export \{ COMMANDS, QUERIES \} from "\.\/types\.js";/);
  assert.match(distTypes, /export \{ COMMANDS, QUERIES \} from "\.\/types\.js";/);
});

test("exports documented runtime client helpers", () => {
  assert.match(distEntry, /buildAppointmentTitle/);
  assert.match(distEntry, /createMaiClient/);
  assert.match(distEntry, /createBookSlotCommand/);
  assert.match(distEntry, /createCommandEnvelope/);
  assert.match(distEntry, /createQueryEnvelope/);
  assert.match(distEntry, /executeCommand/);
  assert.match(distEntry, /executeWeeklyLayoutQuery/);
  assert.match(distEntry, /parseJsonResponse/);
  assert.match(distTypes, /type MaiClient/);
});

test("exports documented type namespace", () => {
  assert.match(distTypes, /MaiCore/);
  assert.match(distTypes, /WeeklyLayout/);
  assert.match(distTypes, /AnyCommand/);
  assert.match(distTypes, /WeeklyLayoutQueryPayload/);
});

test("does not expose wasm internals in app-facing entry", () => {
  assert.doesNotMatch(distEntry, /core\/pkg/i);
  assert.doesNotMatch(distEntry, /WasmBindgenAdapter/i);
  assert.doesNotMatch(distEntry, /mai_bg\.wasm/i);
});
