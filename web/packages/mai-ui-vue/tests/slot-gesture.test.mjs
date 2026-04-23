import assert from "node:assert/strict";
import test from "node:test";

import {
  computeMoveDraft,
  computeResizeBottomDraft,
  computeResizeTopDraft,
} from "../dist/board/model/slot-gesture.js";

const gestureBaseline = {
  gridHeight: 960,
  columnWidth: 140,
  totalVisibleMinutes: 1440,
};

test("computeMoveDraft snaps to minute precision and moves day by column width", () => {
  const draft = computeMoveDraft({
    baseDayIndex: 2,
    baseStartMinute: 540,
    baseEndMinute: 600,
    gesture: {
      ...gestureBaseline,
      deltaClientX: 170,
      deltaClientY: 17,
    },
  });

  assert.deepEqual(draft, {
    dayIndex: 3,
    startMinute: 566,
    endMinute: 626,
  });
});

test("computeResizeTopDraft clamps to minimum 1-minute span", () => {
  const draft = computeResizeTopDraft({
    baseStartMinute: 600,
    baseEndMinute: 660,
    gesture: {
      ...gestureBaseline,
      deltaClientX: 0,
      deltaClientY: 120,
    },
  });

  assert.deepEqual(draft, {
    startMinute: 659,
    endMinute: 660,
  });
});

test("computeResizeBottomDraft clamps to day boundary", () => {
  const draft = computeResizeBottomDraft({
    baseStartMinute: 1380,
    baseEndMinute: 1410,
    gesture: {
      ...gestureBaseline,
      deltaClientX: 0,
      deltaClientY: 300,
    },
  });

  assert.deepEqual(draft, {
    startMinute: 1380,
    endMinute: 1440,
  });
});
