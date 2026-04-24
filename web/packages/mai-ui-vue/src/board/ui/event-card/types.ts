export type DragMode = "move" | "resize-top" | "resize-bottom";

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
