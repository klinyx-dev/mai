export const MIN_EVENT_VISUAL_SPAN_MINUTES = 15;

export function eventVisualSpanMinutes(
  startMinute: number,
  endMinute: number
): number {
  return Math.max(
    endMinute - startMinute,
    MIN_EVENT_VISUAL_SPAN_MINUTES
  );
}

export function eventVisualHeightPercent(
  startMinute: number,
  endMinute: number,
  totalVisibleMinutes: number
): number {
  return (eventVisualSpanMinutes(startMinute, endMinute) / totalVisibleMinutes) * 100;
}
