import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const boardCss = readFileSync(
  new URL("../packages/mai-ui-vue/dist/styles.css", import.meta.url),
  "utf8"
);
const boardBundle = readFileSync(
  new URL("../packages/mai-ui-vue/dist/features/board/internal/ui/MaiDayColumn.js", import.meta.url),
  "utf8"
);
const headerBundle = readFileSync(
  new URL("../packages/mai-ui-vue/dist/features/board/internal/ui/MaiWeekHeader.js", import.meta.url),
  "utf8"
);

test("ui smoke: day grid remains keyboard interactive", () => {
  assert.match(boardBundle, /onKeydown/);
  assert.match(boardBundle, /Create slot on/);
});

test("ui smoke: header navigation exposes accessible labels", () => {
  assert.match(headerBundle, /Go to previous week/);
  assert.match(headerBundle, /Jump to current week/);
  assert.match(headerBundle, /Go to next week/);
});

test("ui smoke: responsive rules include mobile control wrapping", () => {
  assert.match(boardCss, /@media \(max-width: 640px\)/);
  assert.match(boardCss, /\.mai-board__navigation/);
  assert.match(boardCss, /\.mai-booking-week-label/);
});

test("ui smoke: blackout windows render as non-interactive overlays", () => {
  assert.match(boardBundle, /mai-board__blackout-window/);
  assert.match(boardCss, /\.mai-board__blackout-window/);
  assert.match(boardCss, /pointer-events:\s*none/);
});
