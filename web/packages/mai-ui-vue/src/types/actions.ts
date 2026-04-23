export interface SlotActionEventPayload {
  slotId: string;
}

export interface SlotRescheduleActionEventPayload {
  slotId: string;
  dayIndex: number;
  startMinute: number;
  endMinute: number;
}

export interface AppointmentActionEventPayload {
  appointmentId: string;
}

export interface CreateSlotActionEventPayload {
  slotId: string;
  startIso: string;
  endIso: string;
  assigneeId: string;
  createdBy: string;
}
