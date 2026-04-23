import {
  COMMANDS,
  createCommandEnvelope,
  type AnyCommandEnvelope,
} from "@mai/mai-web-core";
import type {
  AppointmentActionEventPayload,
  CreateSlotActionEventPayload,
  SlotActionEventPayload,
} from "../types";

export interface CommandModeOptions {
  createdBy: string;
  appointmentIdFactory: (slotId: string) => string;
  bookAppointmentInviteeIds: string[];
  bookAppointmentTitle: string;
  bookAppointmentCreatedBy?: string;
  cancelAppointmentBy?: string;
}

export function buildAddSlotCommand(
  payload: CreateSlotActionEventPayload
): AnyCommandEnvelope {
  return createCommandEnvelope(COMMANDS.ADD_SLOT, {
    slot_id: payload.slotId,
    start: payload.startIso,
    end: payload.endIso,
    assignee_id: payload.assigneeId,
    created_by: payload.createdBy,
  });
}

export function buildAddAppointmentCommand(
  payload: SlotActionEventPayload,
  options: CommandModeOptions
): AnyCommandEnvelope {
  return createCommandEnvelope(COMMANDS.ADD_APPOINTMENT, {
    appointment_id: options.appointmentIdFactory(payload.slotId),
    slot_id: payload.slotId,
    invitee_ids: options.bookAppointmentInviteeIds,
    title: options.bookAppointmentTitle,
    created_by: options.bookAppointmentCreatedBy || options.createdBy,
  });
}

export function buildCancelSlotCommand(
  payload: SlotActionEventPayload
): AnyCommandEnvelope {
  return createCommandEnvelope(COMMANDS.CANCEL_SLOT, {
    slot_id: payload.slotId,
  });
}

export function buildDeleteSlotCommand(
  payload: SlotActionEventPayload
): AnyCommandEnvelope {
  return createCommandEnvelope(COMMANDS.DELETE_SLOT, {
    slot_id: payload.slotId,
  });
}

export function buildCancelAppointmentCommand(
  payload: AppointmentActionEventPayload,
  options: CommandModeOptions
): AnyCommandEnvelope {
  return createCommandEnvelope(COMMANDS.CANCEL_APPOINTMENT, {
    appointment_id: payload.appointmentId,
    cancelled_by: options.cancelAppointmentBy || options.createdBy,
  });
}

export function buildDeleteAppointmentCommand(
  payload: AppointmentActionEventPayload
): AnyCommandEnvelope {
  return createCommandEnvelope(COMMANDS.DELETE_APPOINTMENT, {
    appointment_id: payload.appointmentId,
  });
}
