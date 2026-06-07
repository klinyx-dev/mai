export type EventTimeDensity = "micro" | "tight" | "compact" | "comfortable";

export function eventTimeText(
  minuteLabel: (value: number) => string,
  startMinute: number,
  endMinute: number,
  density: EventTimeDensity
): string {
  if (density !== "comfortable") {
    return minuteLabel(startMinute);
  }

  return `${minuteLabel(startMinute)}-${minuteLabel(endMinute)}`;
}
