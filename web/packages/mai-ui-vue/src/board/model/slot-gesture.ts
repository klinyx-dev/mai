const MINUTES_PER_DAY = 1440;
export const SLOT_SNAP_MINUTES = 15;

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
    params.baseEndMinute - SLOT_SNAP_MINUTES
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
    params.baseStartMinute + SLOT_SNAP_MINUTES,
    MINUTES_PER_DAY
  );
  return {
    startMinute: params.baseStartMinute,
    endMinute,
  };
}
