const MINUTES_PER_DAY = 1440;
const DAYS_PER_WEEK = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface NowIndicatorPosition {
  minuteOfDay: number;
  topPercent: number;
}

export interface WeekNowIndicatorPosition extends NowIndicatorPosition {
  dayIndex: number;
}

export interface DateNowIndicatorInput {
  dateIso: string;
  visibleStartMinute: number;
  visibleEndMinute: number;
  now: Date;
}

export interface WeekNowIndicatorInput {
  weekStartIso: string;
  visibleStartMinute: number;
  visibleEndMinute: number;
  now: Date;
}

function padTwo(value: number): string {
  return value.toString().padStart(2, "0");
}

function dateFromIso(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

export function localIsoDateFromDate(date: Date): string {
  return `${date.getFullYear()}-${padTwo(date.getMonth() + 1)}-${padTwo(
    date.getDate()
  )}`;
}

export function minuteOfDayFromDate(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function buildNowIndicatorForDate({
  dateIso,
  visibleStartMinute,
  visibleEndMinute,
  now,
}: DateNowIndicatorInput): NowIndicatorPosition | null {
  const visibleMinutes = visibleEndMinute - visibleStartMinute;
  if (visibleMinutes <= 0) {
    return null;
  }

  if (dateIso !== localIsoDateFromDate(now)) {
    return null;
  }

  const minuteOfDay = minuteOfDayFromDate(now);
  if (minuteOfDay < visibleStartMinute || minuteOfDay > visibleEndMinute) {
    return null;
  }

  return {
    minuteOfDay,
    topPercent: ((minuteOfDay - visibleStartMinute) / visibleMinutes) * 100,
  };
}

export function buildNowIndicatorForWeek({
  weekStartIso,
  visibleStartMinute,
  visibleEndMinute,
  now,
}: WeekNowIndicatorInput): WeekNowIndicatorPosition | null {
  const todayIso = localIsoDateFromDate(now);
  const weekStart = dateFromIso(weekStartIso);
  const today = dateFromIso(todayIso);
  const dayIndex = Math.floor((today.getTime() - weekStart.getTime()) / MS_PER_DAY);

  if (!Number.isFinite(dayIndex) || dayIndex < 0 || dayIndex >= DAYS_PER_WEEK) {
    return null;
  }

  const position = buildNowIndicatorForDate({
    dateIso: todayIso,
    visibleStartMinute,
    visibleEndMinute,
    now,
  });

  if (!position) {
    return null;
  }

  return {
    ...position,
    dayIndex,
  };
}
