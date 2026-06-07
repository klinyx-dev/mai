export type WeekShift = -1 | 0 | 1;

export const MAI_TIME_LABEL_FORMATS = {
  TWENTY_FOUR_HOUR: "24h",
  TWELVE_HOUR: "12h",
} as const;

export type TimeLabelFormat =
  (typeof MAI_TIME_LABEL_FORMATS)[keyof typeof MAI_TIME_LABEL_FORMATS];

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
  startMinute?: number;
  endMinute?: number;
  clientX: number;
  clientY: number;
  columnRect: InteractionAnchorRect;
}

export interface SlotDraftPreview {
  dayIndex: number;
  startMinute: number;
  endMinute: number;
}
