export const MAI_ACTION_DAY_LABELS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
] as const;
export const MAI_ACTION_MINUTE_PER_DAY = 1440;

export function actionDayLabel(dayIndex: number): string {
  return MAI_ACTION_DAY_LABELS[dayIndex] ?? `Day ${dayIndex + 1}`;
}

function actionTimeLabelFromMinuteOfDay(minuteOfDay: number): string {
  const safeMinute = Math.max(
    0,
    Math.min(MAI_ACTION_MINUTE_PER_DAY, Math.round(minuteOfDay))
  );
  const hours = Math.floor(safeMinute / 60);
  const minutes = safeMinute % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function actionTimeRangeLabel(
  startMinute: number,
  endMinute: number
): string {
  return `${actionTimeLabelFromMinuteOfDay(startMinute)} - ${actionTimeLabelFromMinuteOfDay(
    endMinute
  )}`;
}
