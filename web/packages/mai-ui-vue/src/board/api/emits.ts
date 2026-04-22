import type {
  AppointmentActionEventPayload,
  AppointmentClickEventPayload,
  CreateSlotActionEventPayload,
  EmptyCellClickEventPayload,
  SlotActionEventPayload,
  SlotClickEventPayload,
  WeekShift,
} from "../../types";
import { MAI_BOARD_EVENTS } from "./events";
import {
  isAppointmentActionPayload,
  isAppointmentClickPayload,
  isCreateSlotPayload,
  isEmptyCellClickPayload,
  isSlotActionPayload,
  isSlotClickPayload,
} from "./validators";

export const maiBoardEmits = {
  [MAI_BOARD_EVENTS.NAVIGATE_WEEK]: (shift: WeekShift) =>
    shift === -1 || shift === 0 || shift === 1,
  [MAI_BOARD_EVENTS.SLOT_CLICK]: (payload: SlotClickEventPayload) =>
    isSlotClickPayload(payload),
  [MAI_BOARD_EVENTS.APPOINTMENT_CLICK]: (payload: AppointmentClickEventPayload) =>
    isAppointmentClickPayload(payload),
  [MAI_BOARD_EVENTS.EMPTY_CELL_CLICK]: (payload: EmptyCellClickEventPayload) =>
    isEmptyCellClickPayload(payload),
  [MAI_BOARD_EVENTS.CREATE_SLOT]: (payload: CreateSlotActionEventPayload) =>
    isCreateSlotPayload(payload),
  [MAI_BOARD_EVENTS.BOOK_SLOT]: (payload: SlotActionEventPayload) =>
    isSlotActionPayload(payload),
  [MAI_BOARD_EVENTS.CANCEL_SLOT]: (payload: SlotActionEventPayload) =>
    isSlotActionPayload(payload),
  [MAI_BOARD_EVENTS.DELETE_SLOT]: (payload: SlotActionEventPayload) =>
    isSlotActionPayload(payload),
  [MAI_BOARD_EVENTS.CANCEL_APPOINTMENT]: (payload: AppointmentActionEventPayload) =>
    isAppointmentActionPayload(payload),
  [MAI_BOARD_EVENTS.DELETE_APPOINTMENT]: (payload: AppointmentActionEventPayload) =>
    isAppointmentActionPayload(payload),
};

export interface MaiBoardEmit {
  (event: typeof MAI_BOARD_EVENTS.NAVIGATE_WEEK, payload: WeekShift): void;
  (event: typeof MAI_BOARD_EVENTS.SLOT_CLICK, payload: SlotClickEventPayload): void;
  (
    event: typeof MAI_BOARD_EVENTS.APPOINTMENT_CLICK,
    payload: AppointmentClickEventPayload
  ): void;
  (
    event: typeof MAI_BOARD_EVENTS.EMPTY_CELL_CLICK,
    payload: EmptyCellClickEventPayload
  ): void;
  (event: typeof MAI_BOARD_EVENTS.CREATE_SLOT, payload: CreateSlotActionEventPayload): void;
  (event: typeof MAI_BOARD_EVENTS.BOOK_SLOT, payload: SlotActionEventPayload): void;
  (event: typeof MAI_BOARD_EVENTS.CANCEL_SLOT, payload: SlotActionEventPayload): void;
  (event: typeof MAI_BOARD_EVENTS.DELETE_SLOT, payload: SlotActionEventPayload): void;
  (
    event: typeof MAI_BOARD_EVENTS.CANCEL_APPOINTMENT,
    payload: AppointmentActionEventPayload
  ): void;
  (
    event: typeof MAI_BOARD_EVENTS.DELETE_APPOINTMENT,
    payload: AppointmentActionEventPayload
  ): void;
}
