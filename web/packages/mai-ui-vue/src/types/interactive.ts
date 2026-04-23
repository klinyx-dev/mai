import type {
  AppointmentActionEventPayload,
  CreateSlotActionEventPayload,
  SlotActionEventPayload,
} from "./actions";

export type MaiInteractionAction =
  | "create-slot"
  | "book-slot"
  | "cancel-slot"
  | "delete-slot"
  | "cancel-appointment"
  | "delete-appointment";

export interface MaiInteractionErrorPayload {
  action: MaiInteractionAction;
  message: string;
}

export interface MaiSlotCreatedEventPayload extends CreateSlotActionEventPayload {}

export interface MaiSlotChangedEventPayload extends SlotActionEventPayload {}

export interface MaiAppointmentChangedEventPayload
  extends AppointmentActionEventPayload {}
