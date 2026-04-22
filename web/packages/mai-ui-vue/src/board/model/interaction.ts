import type {
  AppointmentClickEventPayload,
  EmptyCellClickEventPayload,
  SlotClickEventPayload,
} from "../../types";
import type { CalendarEvent } from "./view-model";

interface InteractionPoint {
  clientX: number;
  clientY: number;
}

export function toSlotClickPayload(
  event: CalendarEvent,
  point: InteractionPoint
): SlotClickEventPayload {
  return {
    slotId: event.slotId,
    dayIndex: event.dayIndex,
    startMinute: event.startMinute,
    endMinute: event.endMinute,
    clientX: point.clientX,
    clientY: point.clientY,
  };
}

export function toAppointmentClickPayload(
  event: CalendarEvent,
  point: InteractionPoint
): AppointmentClickEventPayload {
  return {
    appointmentId: event.id,
    slotId: event.slotId,
    dayIndex: event.dayIndex,
    startMinute: event.startMinute,
    endMinute: event.endMinute,
    clientX: point.clientX,
    clientY: point.clientY,
  };
}

export function toEmptyCellClickPayload(input: {
  dayIndex: number;
  clientX: number;
  clientY: number;
  top: number;
  height: number;
  visibleStartMinute: number;
  totalVisibleMinutes: number;
}): EmptyCellClickEventPayload {
  const relativeY = Math.max(0, Math.min(input.clientY - input.top, input.height));
  const ratio = input.height > 0 ? relativeY / input.height : 0;
  const minute = Math.round(
    input.visibleStartMinute + ratio * input.totalVisibleMinutes
  );

  return {
    dayIndex: input.dayIndex,
    minuteOfDay: Math.min(Math.max(minute, 0), 1440),
    clientX: input.clientX,
    clientY: input.clientY,
  };
}
