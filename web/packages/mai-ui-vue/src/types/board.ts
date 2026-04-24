export type WeekShift = -1 | 0 | 1;

export type TimeLabelFormat = "24h" | "12h";

export interface InteractionAnchorRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface SlotClickEventPayload {
  slotId: string;
  dayIndex: number;
  startMinute: number;
  endMinute: number;
  clientX: number;
  clientY: number;
  anchorRect: InteractionAnchorRect;
}

export interface AppointmentClickEventPayload {
  appointmentId: string;
  slotId: string;
  dayIndex: number;
  startMinute: number;
  endMinute: number;
  clientX: number;
  clientY: number;
  anchorRect: InteractionAnchorRect;
}

export interface EmptyCellClickEventPayload {
  dayIndex: number;
  minuteOfDay: number;
  clientX: number;
  clientY: number;
  columnRect: InteractionAnchorRect;
}

export interface SlotDraftPreview {
  dayIndex: number;
  startMinute: number;
  endMinute: number;
}
