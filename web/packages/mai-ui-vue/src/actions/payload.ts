import type {
  AppointmentActionEventPayload,
  CreateSlotActionEventPayload,
  SlotActionEventPayload,
} from "../types";

const MIN_SLOT_DURATION_MINUTES = 15;
const MAX_SLOT_DURATION_MINUTES = 180;

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

export function buildCreateSlotPayload(
  input: CreateSlotPayloadInput
): CreateSlotActionEventPayload {
  const safeDuration = clampSlotDurationMinutes(input.durationMinutes);
  const start = dateFromWeekPoint(
    input.weekStartIso,
    input.dayIndex,
    input.minuteOfDay
  );
  const end = new Date(start.getTime() + safeDuration * 60 * 1000);

  return {
    slotId: input.slotId ?? `slot-${Date.now()}`,
    startIso: isoFromDate(start),
    endIso: isoFromDate(end),
    assigneeId: input.assigneeId,
    createdBy: input.createdBy,
  };
}
