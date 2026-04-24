import type {
  AppointmentActionEventPayload,
  CreateSlotActionEventPayload,
  SlotActionEventPayload,
  SlotRescheduleActionEventPayload,
} from "./actions";
import type { AnyCommandEnvelope } from "@mai/mai-web-core";
import type { TimeLabelFormat } from "./board";

export const INTERACTION_ACTIONS = {
  CREATE_SLOT: "create-slot",
  RESCHEDULE_SLOT: "reschedule-slot",
  BOOK_SLOT: "book-slot",
  CANCEL_SLOT: "cancel-slot",
  DELETE_SLOT: "delete-slot",
  CANCEL_APPOINTMENT: "cancel-appointment",
  DELETE_APPOINTMENT: "delete-appointment",
} as const;

export const INTERACTION_SUCCESS_EVENTS = {
  SLOT_CREATED: "slot-created",
  SLOT_RESCHEDULED: "slot-rescheduled",
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

export interface MaiSlotRescheduledEventPayload
  extends SlotRescheduleActionEventPayload {}

export interface MaiAppointmentChangedEventPayload
  extends AppointmentActionEventPayload {}

export type MaiActionRunner<TPayload> = (payload: TPayload) => boolean | Promise<boolean>;

export interface MaiBoardInteractiveViewConfig {
  title: string;
  subtitle: string;
  visibleStartMinute: number;
  visibleEndMinute: number;
  timeLabelFormat: TimeLabelFormat;
  emptyStateText: string;
}

export interface MaiBoardInteractiveActorConfig {
  assigneeId: string;
  createdBy: string;
  defaultSlotDurationMinutes: number;
  appointmentIdFactory: (slotId: string) => string;
  bookAppointmentInviteeIds: string[];
  bookAppointmentTitle: string;
  bookAppointmentCreatedBy: string;
  cancelAppointmentBy: string;
}

export interface MaiBoardInteractiveActionConfig {
  createSlot: MaiActionRunner<CreateSlotActionEventPayload> | null;
  bookSlot: MaiActionRunner<SlotActionEventPayload> | null;
  rescheduleSlot: MaiActionRunner<SlotRescheduleActionEventPayload> | null;
  cancelSlot: MaiActionRunner<SlotActionEventPayload> | null;
  deleteSlot: MaiActionRunner<SlotActionEventPayload> | null;
  cancelAppointment: MaiActionRunner<AppointmentActionEventPayload> | null;
  deleteAppointment: MaiActionRunner<AppointmentActionEventPayload> | null;
  mutateCommand: MaiActionRunner<AnyCommandEnvelope> | null;
}
