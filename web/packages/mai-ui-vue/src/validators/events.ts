import type {
  MaiBookSlotPayload,
  MaiBookingAuthIdentity,
  MaiBookingAvailabilitySlot,
  MaiBookingError,
  MaiInteractionErrorPayload,
  MaiViewFilter,
  WeekShift,
} from "../types";
import {
  isAppointmentActionPayload,
  isAppointmentClickPayload,
  isCreateSlotPayload,
  isEmptyCellClickPayload,
  isSlotActionPayload,
  isSlotClickPayload,
  isSlotReschedulePayload,
} from "../board/api/validators.js";

export {
  isAppointmentActionPayload,
  isAppointmentClickPayload,
  isCreateSlotPayload,
  isEmptyCellClickPayload,
  isSlotActionPayload,
  isSlotClickPayload,
  isSlotReschedulePayload,
};

export function isWeekShift(value: unknown): value is WeekShift {
  return value === -1 || value === 0 || value === 1;
}

export function isAlwaysValid(): true {
  return true;
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export function isNullableNonEmptyString(value: unknown): value is string | null {
  return value === null || isNonEmptyString(value);
}

export function isBookingAvailabilitySlot(
  value: unknown
): value is MaiBookingAvailabilitySlot {
  return Boolean(
    value &&
      typeof value === "object" &&
      isNonEmptyString((value as Record<string, unknown>).slotId)
  );
}

export function isBookingAuthIdentity(value: unknown): value is MaiBookingAuthIdentity {
  if (!value || typeof value !== "object") {
    return false;
  }
  const auth = value as Record<string, unknown>;
  return isNonEmptyString(auth.inviteeId) && isNonEmptyString(auth.userDisplayName);
}

export function isBookSlotPayload(value: unknown): value is MaiBookSlotPayload {
  return Boolean(
    value &&
      typeof value === "object" &&
      isNonEmptyString((value as Record<string, unknown>).slotId)
  );
}

export function isBookingError(value: unknown): value is MaiBookingError {
  if (!value || typeof value !== "object") {
    return false;
  }
  const error = value as Record<string, unknown>;
  return isNonEmptyString(error.action) && isNonEmptyString(error.message);
}

export function isMaiViewFilter(value: unknown): value is MaiViewFilter {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Record<string, unknown>;
  return typeof payload.mode === "string" && Array.isArray(payload.ids);
}

export function isMaiInteractionErrorPayload(
  value: unknown
): value is MaiInteractionErrorPayload {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Record<string, unknown>;
  return typeof payload.action === "string" && typeof payload.message === "string";
}
