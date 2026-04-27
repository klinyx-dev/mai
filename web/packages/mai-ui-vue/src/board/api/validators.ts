import type {
  AppointmentActionEventPayload,
  AppointmentClickEventPayload,
  CreateSlotActionEventPayload,
  EmptyCellClickEventPayload,
  SlotActionEventPayload,
  SlotClickEventPayload,
  SlotRescheduleActionEventPayload,
} from "../../types";

export function isMinuteRange(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 1440
  );
}

export function isSlotClickPayload(value: unknown): value is SlotClickEventPayload {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Record<string, unknown>;
  return (
    typeof payload.slotId === "string" &&
    Number.isInteger(payload.dayIndex) &&
    typeof payload.startMinute === "number" &&
    typeof payload.endMinute === "number" &&
    typeof payload.clientX === "number" &&
    typeof payload.clientY === "number"
  );
}

export function isAppointmentClickPayload(
  value: unknown
): value is AppointmentClickEventPayload {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Record<string, unknown>;
  return (
    typeof payload.appointmentId === "string" &&
    typeof payload.slotId === "string" &&
    Number.isInteger(payload.dayIndex) &&
    typeof payload.startMinute === "number" &&
    typeof payload.endMinute === "number" &&
    typeof payload.clientX === "number" &&
    typeof payload.clientY === "number"
  );
}

export function isEmptyCellClickPayload(
  value: unknown
): value is EmptyCellClickEventPayload {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Record<string, unknown>;
  return (
    Number.isInteger(payload.dayIndex) &&
    typeof payload.minuteOfDay === "number" &&
    typeof payload.clientX === "number" &&
    typeof payload.clientY === "number"
  );
}

export function isSlotActionPayload(value: unknown): value is SlotActionEventPayload {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as Record<string, unknown>).slotId === "string"
  );
}

export function isSlotReschedulePayload(
  value: unknown
): value is SlotRescheduleActionEventPayload {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Record<string, unknown>;
  return (
    typeof payload.slotId === "string" &&
    Number.isInteger(payload.dayIndex) &&
    typeof payload.startMinute === "number" &&
    typeof payload.endMinute === "number"
  );
}

export function isAppointmentActionPayload(
  value: unknown
): value is AppointmentActionEventPayload {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as Record<string, unknown>).appointmentId === "string"
  );
}

export function isCreateSlotPayload(value: unknown): value is CreateSlotActionEventPayload {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Record<string, unknown>;
  return (
    typeof payload.slotId === "string" &&
    typeof payload.startIso === "string" &&
    typeof payload.endIso === "string" &&
    typeof payload.resourceOwnerId === "string" &&
    typeof payload.createdBy === "string"
  );
}
