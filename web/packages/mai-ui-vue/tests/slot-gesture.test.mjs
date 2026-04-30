import assert from "node:assert/strict";
import test from "node:test";

import {
  computeCreateDraftFromBlankDrag,
  computeMoveDraft,
  computeResizeBottomDraft,
  computeResizeTopDraft,
  minuteOfDayFromPointer,
} from "../dist/board/model/slot-gesture.js";

const gestureBaseline = {
  gridHeight: 960,
  columnWidth: 140,
  totalVisibleMinutes: 1440,
};

test("computeMoveDraft snaps to 15-minute precision and moves day by column width", () => {
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
    startMinute: 570,
    endMinute: 630,
  });
});

test("computeResizeTopDraft clamps to minimum 5-minute span", () => {
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
    startMinute: 655,
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

test("minuteOfDayFromPointer maps pointer position to snapped minutes", () => {
  const minute = minuteOfDayFromPointer({
    clientY: 200,
    columnTop: 100,
    columnHeight: 600,
    visibleStartMinute: 480,
    visibleEndMinute: 1080,
  });

  assert.equal(minute, 585);
});

test("computeCreateDraftFromBlankDrag builds a downward drag range", () => {
  const draft = computeCreateDraftFromBlankDrag({
    pointerDownClientY: 100,
    pointerCurrentClientY: 200,
    columnTop: 100,
    columnHeight: 600,
    visibleStartMinute: 480,
    visibleEndMinute: 1080,
  });

  assert.deepEqual(draft, {
    startMinute: 480,
    endMinute: 585,
  });
});

test("computeCreateDraftFromBlankDrag normalizes upward drag range", () => {
  const draft = computeCreateDraftFromBlankDrag({
    pointerDownClientY: 260,
    pointerCurrentClientY: 140,
    columnTop: 100,
    columnHeight: 600,
    visibleStartMinute: 480,
    visibleEndMinute: 1080,
  });

  assert.deepEqual(draft, {
    startMinute: 525,
    endMinute: 645,
  });
});

test("computeCreateDraftFromBlankDrag enforces minimum slot span", () => {
  const draft = computeCreateDraftFromBlankDrag({
    pointerDownClientY: 100,
    pointerCurrentClientY: 102,
    columnTop: 100,
    columnHeight: 600,
    visibleStartMinute: 480,
    visibleEndMinute: 1080,
  });

  assert.deepEqual(draft, {
    startMinute: 480,
    endMinute: 485,
  });
});

test("computeCreateDraftFromBlankDrag clamps to visible window", () => {
  const draft = computeCreateDraftFromBlankDrag({
    pointerDownClientY: 700,
    pointerCurrentClientY: 900,
    columnTop: 100,
    columnHeight: 600,
    visibleStartMinute: 480,
    visibleEndMinute: 1080,
  });

  assert.deepEqual(draft, {
    startMinute: 1080 - 5,
    endMinute: 1080,
  });
});
