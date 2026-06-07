import type { SlotRescheduleActionEventPayload } from "../../../../../types";
import {
  computeMoveDraft,
  computeResizeBottomDraft,
  computeResizeTopDraft,
} from "../../model/slot-gesture";
import { eventVisualHeightPercent } from "../../model/event-geometry";
import type { CalendarEvent } from "../../model/view-model";
import type { DragState } from "./types";

export const DRAG_ACTIVATION_PX = 4;
export type EventCardDensity = "micro" | "tight" | "compact" | "comfortable";

export function eventTitle(kind: CalendarEvent["kind"]): string {
  return kind === "slot" ? "Available" : "Booked";
}

export function eventDescription(kind: CalendarEvent["kind"]): string {
  return kind === "slot" ? "Open slot" : "Appointment";
}

export function eventDurationLabel(startMinute: number, endMinute: number): string {
  const totalMinutes = Math.max(endMinute - startMinute, 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${minutes}m`;
}

export function eventCardDensity(
  startMinute: number,
  endMinute: number
): EventCardDensity {
  const totalMinutes = Math.max(endMinute - startMinute, 0);

  if (totalMinutes <= 5) {
    return "micro";
  }
  if (totalMinutes <= 20) {
    return "tight";
  }
  if (totalMinutes <= 40) {
    return "compact";
  }
  return "comfortable";
}

export function centerPointFromTarget(target: EventTarget | null): {
  clientX: number;
  clientY: number;
} {
  const element = target instanceof HTMLElement ? target : null;
  if (!element) {
    return { clientX: 0, clientY: 0 };
  }
  const rect = element.getBoundingClientRect();
  return {
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2,
  };
}

export function swallowNextClickFromDrag() {
  const onClickCapture = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    window.removeEventListener("click", onClickCapture, true);
  };
  window.addEventListener("click", onClickCapture, true);
}

export function timeText(
  minuteLabel: (value: number) => string,
  startMinute: number,
  endMinute: number
): string {
  return `${minuteLabel(startMinute)}-${minuteLabel(endMinute)}`;
}

export function draftFromPointer(params: {
  state: DragState;
  clientX: number;
  clientY: number;
  totalVisibleMinutes: number;
}): DragState {
  const { state, clientX, clientY, totalVisibleMinutes } = params;
  const gesture = {
    deltaClientX: clientX - state.startClientX,
    deltaClientY: clientY - state.startClientY,
    gridHeight: state.gridHeight,
    columnWidth: state.columnWidth,
    totalVisibleMinutes,
  };

  if (state.mode === "move") {
    const next = computeMoveDraft({
      baseDayIndex: state.baseDayIndex,
      baseStartMinute: state.baseStartMinute,
      baseEndMinute: state.baseEndMinute,
      gesture,
    });
    return {
      ...state,
      draftDayIndex: next.dayIndex,
      draftStartMinute: next.startMinute,
      draftEndMinute: next.endMinute,
    };
  }

  if (state.mode === "resize-top") {
    const next = computeResizeTopDraft({
      baseStartMinute: state.baseStartMinute,
      baseEndMinute: state.baseEndMinute,
      gesture,
    });
    return {
      ...state,
      draftStartMinute: next.startMinute,
      draftEndMinute: next.endMinute,
    };
  }

  const next = computeResizeBottomDraft({
    baseStartMinute: state.baseStartMinute,
    baseEndMinute: state.baseEndMinute,
    gesture,
  });
  return {
    ...state,
    draftStartMinute: next.startMinute,
    draftEndMinute: next.endMinute,
  };
}

export function draftTopPercent(
  state: DragState,
  visibleStartMinute: number,
  totalVisibleMinutes: number
): number {
  return ((state.draftStartMinute - visibleStartMinute) / totalVisibleMinutes) * 100;
}

export function draftHeightPercent(state: DragState, totalVisibleMinutes: number): number {
  return eventVisualHeightPercent(
    state.draftStartMinute,
    state.draftEndMinute,
    totalVisibleMinutes
  );
}

export function draftTransform(state: DragState): string | undefined {
  if (state.mode !== "move") {
    return undefined;
  }
  const dayDelta = state.draftDayIndex - state.baseDayIndex;
  return dayDelta === 0 ? undefined : `translateX(calc(${dayDelta} * 100%))`;
}

export function buildReschedulePayload(
  event: CalendarEvent,
  state: DragState
): SlotRescheduleActionEventPayload | null {
  if (event.kind !== "slot") {
    return null;
  }
  const unchanged =
    state.baseDayIndex === state.draftDayIndex &&
    state.baseStartMinute === state.draftStartMinute &&
    state.baseEndMinute === state.draftEndMinute;
  if (unchanged) {
    return null;
  }
  return {
    slotId: event.slotId,
    dayIndex: state.draftDayIndex,
    startMinute: state.draftStartMinute,
    endMinute: state.draftEndMinute,
  };
}
