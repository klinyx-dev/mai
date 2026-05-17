import { MIN_SLOT_SPAN_MINUTES } from "../../board/internal/model/slot-gesture";
import type { InteractionAnchorRect } from "../../../types";
import type { MaiInteractionSelectionState } from "./state";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function buildDraftAnchorRect(params: {
  columnRect: InteractionAnchorRect;
  minuteOfDay: number;
  durationMinutes: number;
  visibleStartMinute: number;
  visibleEndMinute: number;
}): InteractionAnchorRect {
  const horizontalInset = 8;
  const startMinute = clamp(params.minuteOfDay, params.visibleStartMinute, params.visibleEndMinute);
  const endMinute = clamp(
    startMinute + Math.max(params.durationMinutes, MIN_SLOT_SPAN_MINUTES),
    params.visibleStartMinute,
    params.visibleEndMinute
  );
  const visibleMinutes = Math.max(params.visibleEndMinute - params.visibleStartMinute, 1);
  const topRatio = (startMinute - params.visibleStartMinute) / visibleMinutes;
  const heightRatio =
    Math.max(endMinute - startMinute, MIN_SLOT_SPAN_MINUTES) / visibleMinutes;

  return {
    left: params.columnRect.left + horizontalInset,
    top: params.columnRect.top + params.columnRect.height * topRatio,
    width: Math.max(params.columnRect.width - horizontalInset * 2, 120),
    height: Math.max(params.columnRect.height * heightRatio, 18),
  };
}

export function popoverStyleFromAnchorRect(anchorRect: InteractionAnchorRect): Record<string, string> {
  const width = 340;
  const offset = 12;
  const viewportWidth =
    typeof window === "undefined" ? width + offset * 2 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 720 : window.innerHeight;
  const popoverWidth = Math.min(width, Math.max(240, viewportWidth - offset * 2));
  const popoverHeight = 280;
  const anchorRight = anchorRect.left + anchorRect.width;
  const anchorMidY = anchorRect.top + anchorRect.height / 2;
  const spaceOnRight = viewportWidth - anchorRight;
  const spaceOnLeft = anchorRect.left;

  const shouldPlaceRight =
    spaceOnRight >= popoverWidth + offset ||
    (spaceOnRight >= spaceOnLeft && spaceOnLeft < popoverWidth + offset);
  const rawLeft = shouldPlaceRight
    ? anchorRight + offset
    : anchorRect.left - popoverWidth - offset;
  const left = Math.min(
    Math.max(rawLeft, offset),
    Math.max(offset, viewportWidth - popoverWidth - offset)
  );

  const rawTop = anchorMidY - 20;
  const top = Math.min(
    Math.max(rawTop, offset),
    Math.max(offset, viewportHeight - popoverHeight - offset)
  );
  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${popoverWidth}px`,
  };
}

// Builds the style for an active popover overlay from a selection state
export function buildActivePopoverStyle(params: {
  selection: MaiInteractionSelectionState;
  defaultSlotDurationMinutes: number;
  visibleStartMinute: number;
  visibleEndMinute: number;
}): Record<string, string> {
  const { selection } = params;
  if (selection.selectedSlot) {
    return popoverStyleFromAnchorRect(selection.selectedSlot.anchorRect);
  }
  if (selection.selectedAppointment) {
    return popoverStyleFromAnchorRect(selection.selectedAppointment.anchorRect);
  }
  if (selection.pendingSlotDraft) {
    const draftStartMinute =
      typeof selection.pendingSlotDraft.startMinute === "number"
        ? selection.pendingSlotDraft.startMinute
        : selection.pendingSlotDraft.minuteOfDay;
    const draftEndMinute =
      typeof selection.pendingSlotDraft.endMinute === "number"
        ? selection.pendingSlotDraft.endMinute
        : draftStartMinute + params.defaultSlotDurationMinutes;
    const anchorRect = buildDraftAnchorRect({
      columnRect: selection.pendingSlotDraft.columnRect,
      minuteOfDay: draftStartMinute,
      durationMinutes: Math.max(draftEndMinute - draftStartMinute, MIN_SLOT_SPAN_MINUTES),
      visibleStartMinute: params.visibleStartMinute,
      visibleEndMinute: params.visibleEndMinute,
    });
    return popoverStyleFromAnchorRect(anchorRect);
  }
  return {};
}

export function buildPreviewSlotDraft(params: {
  selection: MaiInteractionSelectionState;
  defaultSlotDurationMinutes: number;
}): { dayIndex: number; startMinute: number; endMinute: number } | null {
  if (!params.selection.pendingSlotDraft) {
    return null;
  }

  const fallbackStartMinute = Math.max(
    0,
    Math.min(1440, params.selection.pendingSlotDraft.minuteOfDay)
  );
  const rawStartMinute =
    typeof params.selection.pendingSlotDraft.startMinute === "number"
      ? params.selection.pendingSlotDraft.startMinute
      : fallbackStartMinute;
  const startMinute = Math.max(0, Math.min(1440, rawStartMinute));

  const rawEndMinute =
    typeof params.selection.pendingSlotDraft.endMinute === "number"
      ? params.selection.pendingSlotDraft.endMinute
      : startMinute + params.defaultSlotDurationMinutes;
  const endMinute = Math.max(
    startMinute + MIN_SLOT_SPAN_MINUTES,
    Math.min(1440, rawEndMinute)
  );

  return {
    dayIndex: params.selection.pendingSlotDraft.dayIndex,
    startMinute,
    endMinute,
  };
}
