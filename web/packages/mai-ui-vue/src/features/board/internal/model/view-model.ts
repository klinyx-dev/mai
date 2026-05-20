import type { WeeklyLayout } from "@mai/mai-web-core";

export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const DEFAULT_VISIBLE_START_MINUTE = 0;
export const DEFAULT_VISIBLE_END_MINUTE = 1440;
export const DEFAULT_TOTAL_VISIBLE_MINUTES =
  DEFAULT_VISIBLE_END_MINUTE - DEFAULT_VISIBLE_START_MINUTE;

export type CalendarEvent =
  | {
      id: string;
      kind: "slot";
      slotId: string;
      dayIndex: number;
      startMinute: number;
      endMinute: number;
    }
  | {
      id: string;
      kind: "appointment";
      slotId: string;
      dayIndex: number;
      startMinute: number;
      endMinute: number;
    };

export interface DayColumn {
  dayIndex: number;
  label: string;
  dateLabel: string;
  isToday: boolean;
  events: CalendarEvent[];
  blackoutWindows: {
    id: string;
    dayIndex: number;
    startMinute: number;
    endMinute: number;
  }[];
}

function minuteLabel24h(totalMinutes: number): string {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
}

function minuteLabel12h(totalMinutes: number): string {
  const normalized = totalMinutes % 1440;
  const hour24 = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const suffix = hour24 < 12 ? "AM" : "PM";
  const hour12Raw = hour24 % 12;
  const hour12 = hour12Raw === 0 ? 12 : hour12Raw;
  return `${hour12}:${minute.toString().padStart(2, "0")} ${suffix}`;
}

export function formatMinuteLabel(
  totalMinutes: number,
  format: "24h" | "12h"
): string {
  if (format === "12h") {
    return minuteLabel12h(totalMinutes);
  }
  return minuteLabel24h(totalMinutes);
}

function dateFromIso(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

function isoFromDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function todayIsoUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export function startOfWeekIso(anchorDate: string): string {
  const date = dateFromIso(anchorDate);
  const day = date.getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + offset);
  return isoFromDate(date);
}

export function addDaysIso(isoDate: string, days: number): string {
  const date = dateFromIso(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return isoFromDate(date);
}

function monthDayLabel(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(dateFromIso(isoDate));
}

function weekdayLabel(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "UTC",
  }).format(dateFromIso(isoDate));
}

export function weekRangeLabel(weekStartIso: string, weekEndIso: string): string {
  const start = dateFromIso(weekStartIso);
  const end = dateFromIso(weekEndIso);
  const sameMonth = start.getUTCMonth() === end.getUTCMonth();
  const startLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(start);
  const endLabel = new Intl.DateTimeFormat("en-US", {
    month: sameMonth ? undefined : "short",
    day: "numeric",
    year: start.getUTCFullYear() === end.getUTCFullYear() ? undefined : "numeric",
    timeZone: "UTC",
  }).format(end);
  return `${startLabel} - ${endLabel}`;
}

export function createHourTicks(startMinute: number, endMinute: number): number[] {
  const ticks: number[] = [];
  for (let minute = startMinute; minute <= endMinute; minute += 60) {
    ticks.push(minute);
  }
  return ticks;
}

export function clampToVisibleRange(
  startMinute: number,
  endMinute: number,
  visibleStartMinute: number,
  visibleEndMinute: number
): { start: number; end: number } {
  return {
    start: Math.max(startMinute, visibleStartMinute),
    end: Math.min(endMinute, visibleEndMinute),
  };
}

export function normalizeVisibleWindow(
  startMinute: number,
  endMinute: number
): { startMinute: number; endMinute: number } {
  const clampedStart = Math.min(Math.max(startMinute, 0), 1440);
  const clampedEnd = Math.min(Math.max(endMinute, 0), 1440);
  if (clampedStart >= clampedEnd) {
    return {
      startMinute: DEFAULT_VISIBLE_START_MINUTE,
      endMinute: DEFAULT_VISIBLE_END_MINUTE,
    };
  }
  return { startMinute: clampedStart, endMinute: clampedEnd };
}

export function mapCalendarEvents(layout: WeeklyLayout | null): CalendarEvent[] {
  if (!layout) {
    return [];
  }
  const slots: CalendarEvent[] = layout.slots.map((slot) => ({
    id: slot.slot_id,
    slotId: slot.slot_id,
    kind: "slot",
    dayIndex: slot.day_index,
    startMinute: slot.start_minute,
    endMinute: slot.end_minute,
  }));

  const appointments: CalendarEvent[] = layout.appointments.map((appointment) => ({
    id: appointment.appointment_id,
    slotId: appointment.slot_id,
    kind: "appointment",
    dayIndex: appointment.day_index,
    startMinute: appointment.start_minute,
    endMinute: appointment.end_minute,
  }));

  return [...slots, ...appointments];
}

export function mapBlackoutWindows(layout: WeeklyLayout | null): DayColumn["blackoutWindows"] {
  if (!layout?.blackout_windows) {
    return [];
  }
  return layout.blackout_windows.map((window) => ({
    id: window.blackout_id,
    dayIndex: window.day_index,
    startMinute: window.start_minute,
    endMinute: window.end_minute,
  }));
}

export function buildDayColumns(
  weekStartIso: string,
  events: CalendarEvent[],
  blackoutWindows: DayColumn["blackoutWindows"] = []
): DayColumn[] {
  const dayDates = DAY_LABELS.map((_, dayIndex) => addDaysIso(weekStartIso, dayIndex));
  const todayIso = todayIsoUtc();
  return DAY_LABELS.map((_, dayIndex) => ({
    dayIndex,
    label: weekdayLabel(dayDates[dayIndex]),
    dateLabel: monthDayLabel(dayDates[dayIndex]),
    isToday: dayDates[dayIndex] === todayIso,
    events: events
      .filter((event) => event.dayIndex === dayIndex)
      .sort((a, b) => a.startMinute - b.startMinute || a.endMinute - b.endMinute),
    blackoutWindows: blackoutWindows
      .filter((window) => window.dayIndex === dayIndex)
      .sort((a, b) => a.startMinute - b.startMinute || a.endMinute - b.endMinute),
  }));
}
