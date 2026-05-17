const MINUTES_PER_DAY = 1440;
export const SLOT_SNAP_MINUTES = 15;
export const MIN_SLOT_SPAN_MINUTES = 5;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function snapMinuteDelta(rawDeltaMinutes: number): number {
  return Math.round(rawDeltaMinutes / SLOT_SNAP_MINUTES) * SLOT_SNAP_MINUTES;
}

interface GestureInput {
  deltaClientX: number;
  deltaClientY: number;
  gridHeight: number;
  columnWidth: number;
  totalVisibleMinutes: number;
}

interface PointerMinuteInput {
  clientY: number;
  columnTop: number;
  columnHeight: number;
  visibleStartMinute: number;
  visibleEndMinute: number;
}

export function minuteOfDayFromPointer(params: PointerMinuteInput): number {
  const visibleMinutes = Math.max(
    params.visibleEndMinute - params.visibleStartMinute,
    MIN_SLOT_SPAN_MINUTES
  );
  const ratio =
    params.columnHeight > 0
      ? clamp((params.clientY - params.columnTop) / params.columnHeight, 0, 1)
      : 0;
  const minute =
    params.visibleStartMinute + visibleMinutes * ratio;
  const snappedMinute = snapMinuteDelta(minute);
  return clamp(snappedMinute, params.visibleStartMinute, params.visibleEndMinute);
}

function minuteDeltaFromGesture(input: GestureInput): number {
  const minutePerPixel =
    input.gridHeight > 0 ? input.totalVisibleMinutes / input.gridHeight : 0;
  return snapMinuteDelta(input.deltaClientY * minutePerPixel);
}

function dayDeltaFromGesture(input: GestureInput): number {
  if (input.columnWidth <= 0) {
    return 0;
  }
  return Math.round(input.deltaClientX / input.columnWidth);
}

export function computeMoveDraft(params: {
  baseDayIndex: number;
  baseStartMinute: number;
  baseEndMinute: number;
  gesture: GestureInput;
}): { dayIndex: number; startMinute: number; endMinute: number } {
  const duration = params.baseEndMinute - params.baseStartMinute;
  const minuteDelta = minuteDeltaFromGesture(params.gesture);
  const dayDelta = dayDeltaFromGesture(params.gesture);
  const dayIndex = clamp(params.baseDayIndex + dayDelta, 0, 6);
  const startMinute = clamp(
    params.baseStartMinute + minuteDelta,
    0,
    MINUTES_PER_DAY - duration
  );
  return {
    dayIndex,
    startMinute,
    endMinute: startMinute + duration,
  };
}

export function computeResizeTopDraft(params: {
  baseStartMinute: number;
  baseEndMinute: number;
  gesture: GestureInput;
}): { startMinute: number; endMinute: number } {
  const minuteDelta = minuteDeltaFromGesture(params.gesture);
  const startMinute = clamp(
    params.baseStartMinute + minuteDelta,
    0,
    params.baseEndMinute - MIN_SLOT_SPAN_MINUTES
  );
  return {
    startMinute,
    endMinute: params.baseEndMinute,
  };
}

export function computeResizeBottomDraft(params: {
  baseStartMinute: number;
  baseEndMinute: number;
  gesture: GestureInput;
}): { startMinute: number; endMinute: number } {
  const minuteDelta = minuteDeltaFromGesture(params.gesture);
  const endMinute = clamp(
    params.baseEndMinute + minuteDelta,
    params.baseStartMinute + MIN_SLOT_SPAN_MINUTES,
    MINUTES_PER_DAY
  );
  return {
    startMinute: params.baseStartMinute,
    endMinute,
  };
}

export function computeCreateDraftFromBlankDrag(params: {
  pointerDownClientY: number;
  pointerCurrentClientY: number;
  columnTop: number;
  columnHeight: number;
  visibleStartMinute: number;
  visibleEndMinute: number;
}): { startMinute: number; endMinute: number } {
  const anchorMinute = minuteOfDayFromPointer({
    clientY: params.pointerDownClientY,
    columnTop: params.columnTop,
    columnHeight: params.columnHeight,
    visibleStartMinute: params.visibleStartMinute,
    visibleEndMinute: params.visibleEndMinute,
  });
  const currentMinute = minuteOfDayFromPointer({
    clientY: params.pointerCurrentClientY,
    columnTop: params.columnTop,
    columnHeight: params.columnHeight,
    visibleStartMinute: params.visibleStartMinute,
    visibleEndMinute: params.visibleEndMinute,
  });

  let startMinute = Math.min(anchorMinute, currentMinute);
  let endMinute = Math.max(anchorMinute, currentMinute);
  const draggedDownward = currentMinute >= anchorMinute;

  if (endMinute - startMinute < MIN_SLOT_SPAN_MINUTES) {
    if (draggedDownward) {
      endMinute = Math.min(
        params.visibleEndMinute,
        startMinute + MIN_SLOT_SPAN_MINUTES
      );
      startMinute = Math.max(
        params.visibleStartMinute,
        endMinute - MIN_SLOT_SPAN_MINUTES
      );
    } else {
      startMinute = Math.max(
        params.visibleStartMinute,
        endMinute - MIN_SLOT_SPAN_MINUTES
      );
      endMinute = Math.min(
        params.visibleEndMinute,
        startMinute + MIN_SLOT_SPAN_MINUTES
      );
    }
  }

  return {
    startMinute,
    endMinute,
  };
}
