import {
  COMMANDS,
  createCommandEnvelope,
  type AnyCommandEnvelope,
} from "@mai/mai-web-core";
import type {
  AppointmentActionEventPayload,
  CreateSlotActionEventPayload,
  SlotActionEventPayload,
  SlotRescheduleActionEventPayload,
} from "../../../types";
import { dateFromWeekPoint, isoFromDate } from "../actions/payload.js";

export interface CommandModeOptions {
  createdBy: string;
  appointmentIdFactory: (slotId: string) => string;
  bookAppointmentInviteeIds: string[];
  bookAppointmentTitle: string;
  bookAppointmentCreatedBy?: string;
  cancelAppointmentBy?: string;
  weekStartIso: string;
}

export function buildAddSlotCommand(
  payload: CreateSlotActionEventPayload
): AnyCommandEnvelope {
  return createCommandEnvelope(COMMANDS.ADD_SLOT, {
    slot_id: payload.slotId,
    start: payload.startIso,
    end: payload.endIso,
    resource_owner_id: payload.resourceOwnerId,
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

export function buildRescheduleSlotCommand(
  payload: SlotRescheduleActionEventPayload,
  options: CommandModeOptions
): AnyCommandEnvelope {
  return createCommandEnvelope(COMMANDS.RESCHEDULE_SLOT, {
    slot_id: payload.slotId,
    new_start: isoFromDate(
      dateFromWeekPoint(options.weekStartIso, payload.dayIndex, payload.startMinute)
    ),
    new_end: isoFromDate(
      dateFromWeekPoint(options.weekStartIso, payload.dayIndex, payload.endMinute)
    ),
    updated_by: options.createdBy,
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
