import type { WeeklyLayout } from "@mai/mai-web-core";

export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const DEFAULT_VISIBLE_START_MINUTE = 8 * 60;
export const DEFAULT_VISIBLE_END_MINUTE = 20 * 60;
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
  events: CalendarEvent[];
}

export function minuteLabel(totalMinutes: number): string {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
}

function dateFromIso(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

function isoFromDate(date: Date): string {
  return date.toISOString().slice(0, 10);
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

export function buildDayColumns(weekStartIso: string, events: CalendarEvent[]): DayColumn[] {
  const dayDates = DAY_LABELS.map((_, dayIndex) => addDaysIso(weekStartIso, dayIndex));
  return DAY_LABELS.map((_, dayIndex) => ({
    dayIndex,
    label: weekdayLabel(dayDates[dayIndex]),
    dateLabel: monthDayLabel(dayDates[dayIndex]),
    events: events
      .filter((event) => event.dayIndex === dayIndex)
      .sort((a, b) => a.startMinute - b.startMinute || a.endMinute - b.endMinute),
  }));
}
