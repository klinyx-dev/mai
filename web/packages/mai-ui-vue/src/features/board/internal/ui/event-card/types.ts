export const MAI_EVENT_DRAG_MODES = {
  MOVE: "move",
  RESIZE_TOP: "resize-top",
  RESIZE_BOTTOM: "resize-bottom",
} as const;

export type DragMode =
  (typeof MAI_EVENT_DRAG_MODES)[keyof typeof MAI_EVENT_DRAG_MODES];

export interface DragState {
  mode: DragMode;
  startClientX: number;
  startClientY: number;
  baseDayIndex: number;
  baseStartMinute: number;
  baseEndMinute: number;
  draftDayIndex: number;
  draftStartMinute: number;
  draftEndMinute: number;
  gridHeight: number;
  columnWidth: number;
}
