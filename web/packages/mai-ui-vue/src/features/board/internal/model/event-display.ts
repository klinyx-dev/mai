export const MAI_EVENT_TIME_DENSITIES = {
  MICRO: "micro",
  TIGHT: "tight",
  COMPACT: "compact",
  MEDIUM: "medium",
  COMFORTABLE: "comfortable",
} as const;

export type EventTimeDensity =
  (typeof MAI_EVENT_TIME_DENSITIES)[keyof typeof MAI_EVENT_TIME_DENSITIES];

export function eventCardDensity(
  startMinute: number,
  endMinute: number
): EventTimeDensity {
  const totalMinutes = Math.max(endMinute - startMinute, 0);

  if (totalMinutes <= 5) {
    return MAI_EVENT_TIME_DENSITIES.MICRO;
  }
  if (totalMinutes <= 20) {
    return MAI_EVENT_TIME_DENSITIES.TIGHT;
  }
  if (totalMinutes <= 40) {
    return MAI_EVENT_TIME_DENSITIES.COMPACT;
  }
  if (totalMinutes <= 60) {
    return MAI_EVENT_TIME_DENSITIES.MEDIUM;
  }

  return MAI_EVENT_TIME_DENSITIES.COMFORTABLE;
}

export function eventTimeText(
  minuteLabel: (value: number) => string,
  startMinute: number,
  endMinute: number,
  density: EventTimeDensity
): string {
  if (
    density !== MAI_EVENT_TIME_DENSITIES.MEDIUM &&
    density !== MAI_EVENT_TIME_DENSITIES.COMFORTABLE
  ) {
    return minuteLabel(startMinute);
  }

  return `${minuteLabel(startMinute)}-${minuteLabel(endMinute)}`;
}
