export type WeekShift = -1 | 0 | 1;

export type TimeLabelFormat = "24h" | "12h";

export interface SlotClickEventPayload {
  slotId: string;
  dayIndex: number;
  startMinute: number;
  endMinute: number;
}

export interface AppointmentClickEventPayload {
  appointmentId: string;
  slotId: string;
  dayIndex: number;
  startMinute: number;
  endMinute: number;
}

export interface EmptyCellClickEventPayload {
  dayIndex: number;
  minuteOfDay: number;
}
