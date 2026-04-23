import type {
  AppointmentActionEventPayload,
  CreateSlotActionEventPayload,
  SlotActionEventPayload,
} from "./actions";

export const INTERACTION_ACTIONS = {
  CREATE_SLOT: "create-slot",
  BOOK_SLOT: "book-slot",
  CANCEL_SLOT: "cancel-slot",
  DELETE_SLOT: "delete-slot",
  CANCEL_APPOINTMENT: "cancel-appointment",
  DELETE_APPOINTMENT: "delete-appointment",
} as const;

export const INTERACTION_SUCCESS_EVENTS = {
  SLOT_CREATED: "slot-created",
  SLOT_BOOKED: "slot-booked",
  SLOT_CANCELLED: "slot-cancelled",
  SLOT_DELETED: "slot-deleted",
  APPOINTMENT_CANCELLED: "appointment-cancelled",
  APPOINTMENT_DELETED: "appointment-deleted",
} as const;

export type MaiInteractionAction =
  (typeof INTERACTION_ACTIONS)[keyof typeof INTERACTION_ACTIONS];
export type MaiInteractionSuccessEvent =
  (typeof INTERACTION_SUCCESS_EVENTS)[keyof typeof INTERACTION_SUCCESS_EVENTS];

export interface MaiInteractionErrorPayload {
  action: MaiInteractionAction;
  message: string;
}

export interface MaiSlotCreatedEventPayload extends CreateSlotActionEventPayload {}

export interface MaiSlotChangedEventPayload extends SlotActionEventPayload {}

export interface MaiAppointmentChangedEventPayload
  extends AppointmentActionEventPayload {}
