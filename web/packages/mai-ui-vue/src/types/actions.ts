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
  resourceOwnerId: string;
  createdBy: string;
  capacity?: number;
}

export interface CreateBlackoutActionEventPayload {
  blackoutId: string;
  startIso: string;
  endIso: string;
  resourceOwnerId: string;
  reason: string;
  createdBy: string;
}
