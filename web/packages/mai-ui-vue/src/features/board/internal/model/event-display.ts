export const MAI_EVENT_TIME_DENSITIES = {
  MICRO: "micro",
  TIGHT: "tight",
  COMPACT: "compact",
  COMFORTABLE: "comfortable",
} as const;

export type EventTimeDensity =
  (typeof MAI_EVENT_TIME_DENSITIES)[keyof typeof MAI_EVENT_TIME_DENSITIES];

export function eventTimeText(
  minuteLabel: (value: number) => string,
  startMinute: number,
  endMinute: number,
  density: EventTimeDensity
): string {
  if (density !== MAI_EVENT_TIME_DENSITIES.COMFORTABLE) {
    return minuteLabel(startMinute);
  }

  return `${minuteLabel(startMinute)}-${minuteLabel(endMinute)}`;
}
