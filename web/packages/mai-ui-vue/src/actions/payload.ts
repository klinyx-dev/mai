import type {
  AppointmentActionEventPayload,
  CreateSlotActionEventPayload,
  SlotActionEventPayload,
} from "../types";

const MIN_SLOT_DURATION_MINUTES = 15;
const MAX_SLOT_DURATION_MINUTES = 180;
const MINUTE_PER_DAY = 1440;

export function isoFromDate(date: Date): string {
  return date.toISOString();
}

export function dateFromWeekPoint(
  weekStartIso: string,
  dayIndex: number,
  minuteOfDay: number
): Date {
  const base = new Date(`${weekStartIso}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + dayIndex);
  base.setUTCMinutes(minuteOfDay, 0, 0);
  return base;
}

export function clampSlotDurationMinutes(durationMinutes: number): number {
  return Math.max(
    MIN_SLOT_DURATION_MINUTES,
    Math.min(durationMinutes, MAX_SLOT_DURATION_MINUTES)
  );
}

export function clampMinuteOfDay(minuteOfDay: number): number {
  return Math.max(0, Math.min(MINUTE_PER_DAY, minuteOfDay));
}

export function minuteOfDayFromTimeLabel(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return null;
  }
  if (hours < 0 || hours > 24 || minutes < 0 || minutes > 59) {
    return null;
  }
  if (hours === 24 && minutes !== 0) {
    return null;
  }
  return hours * 60 + minutes;
}

export function timeLabelFromMinuteOfDay(minuteOfDay: number): string {
  const safeMinute = clampMinuteOfDay(Math.round(minuteOfDay));
  const hours = Math.floor(safeMinute / 60);
  const minutes = safeMinute % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function normalizeSlotMinuteRange(
  startMinute: number,
  endMinute: number
): { startMinute: number; endMinute: number } {
  const safeStart = Math.max(0, Math.min(MINUTE_PER_DAY - MIN_SLOT_DURATION_MINUTES, startMinute));
  const safeEnd = clampMinuteOfDay(endMinute);
  if (safeEnd > safeStart) {
    return { startMinute: safeStart, endMinute: safeEnd };
  }
  return {
    startMinute: safeStart,
    endMinute: Math.min(MINUTE_PER_DAY, safeStart + MIN_SLOT_DURATION_MINUTES),
  };
}

export function buildSlotActionPayload(slotId: string): SlotActionEventPayload {
  return { slotId };
}

export function buildAppointmentActionPayload(
  appointmentId: string
): AppointmentActionEventPayload {
  return { appointmentId };
}

interface CreateSlotPayloadInput {
  weekStartIso: string;
  dayIndex: number;
  minuteOfDay: number;
  durationMinutes: number;
  assigneeId: string;
  createdBy: string;
  slotId?: string;
}

interface CreateSlotPayloadRangeInput {
  weekStartIso: string;
  dayIndex: number;
  startMinute: number;
  endMinute: number;
  assigneeId: string;
  createdBy: string;
  slotId?: string;
}

export function buildCreateSlotPayloadFromRange(
  input: CreateSlotPayloadRangeInput
): CreateSlotActionEventPayload {
  const { startMinute, endMinute } = normalizeSlotMinuteRange(
    input.startMinute,
    input.endMinute
  );
  const start = dateFromWeekPoint(input.weekStartIso, input.dayIndex, startMinute);
  const end = dateFromWeekPoint(input.weekStartIso, input.dayIndex, endMinute);

  return {
    slotId: input.slotId ?? `slot-${Date.now()}`,
    startIso: isoFromDate(start),
    endIso: isoFromDate(end),
    assigneeId: input.assigneeId,
    createdBy: input.createdBy,
  };
}

export function buildCreateSlotPayload(
  input: CreateSlotPayloadInput
): CreateSlotActionEventPayload {
  const safeDuration = clampSlotDurationMinutes(input.durationMinutes);
  return buildCreateSlotPayloadFromRange({
    weekStartIso: input.weekStartIso,
    dayIndex: input.dayIndex,
    startMinute: input.minuteOfDay,
    endMinute: input.minuteOfDay + safeDuration,
    assigneeId: input.assigneeId,
    createdBy: input.createdBy,
    slotId: input.slotId,
  });
}
