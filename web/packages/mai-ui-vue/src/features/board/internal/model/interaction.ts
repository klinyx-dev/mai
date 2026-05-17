import type {
  AppointmentClickEventPayload,
  EmptyCellClickEventPayload,
  InteractionAnchorRect,
  SlotClickEventPayload,
} from "../../../../types";
import type { CalendarEvent } from "./view-model";

interface InteractionPoint {
  clientX: number;
  clientY: number;
}

function toAnchorRect(rect: InteractionAnchorRect): InteractionAnchorRect {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

export function toSlotClickPayload(
  event: CalendarEvent,
  point: InteractionPoint,
  anchorRect: InteractionAnchorRect
): SlotClickEventPayload {
  return {
    slotId: event.slotId,
    dayIndex: event.dayIndex,
    startMinute: event.startMinute,
    endMinute: event.endMinute,
    clientX: point.clientX,
    clientY: point.clientY,
    anchorRect: toAnchorRect(anchorRect),
  };
}

export function toAppointmentClickPayload(
  event: CalendarEvent,
  point: InteractionPoint,
  anchorRect: InteractionAnchorRect
): AppointmentClickEventPayload {
  return {
    appointmentId: event.id,
    slotId: event.slotId,
    dayIndex: event.dayIndex,
    startMinute: event.startMinute,
    endMinute: event.endMinute,
    clientX: point.clientX,
    clientY: point.clientY,
    anchorRect: toAnchorRect(anchorRect),
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
  columnRect: InteractionAnchorRect;
  draftStartMinute?: number;
  draftEndMinute?: number;
}): EmptyCellClickEventPayload {
  const relativeY = Math.max(0, Math.min(input.clientY - input.top, input.height));
  const ratio = input.height > 0 ? relativeY / input.height : 0;
  const minute = Math.round(
    input.visibleStartMinute + ratio * input.totalVisibleMinutes
  );

  const payload: EmptyCellClickEventPayload = {
    dayIndex: input.dayIndex,
    minuteOfDay: Math.min(Math.max(minute, 0), 1440),
    clientX: input.clientX,
    clientY: input.clientY,
    columnRect: toAnchorRect(input.columnRect),
  };

  if (
    typeof input.draftStartMinute === "number" &&
    typeof input.draftEndMinute === "number"
  ) {
    payload.startMinute = input.draftStartMinute;
    payload.endMinute = input.draftEndMinute;
    payload.minuteOfDay = input.draftStartMinute;
  }

  return payload;
}
