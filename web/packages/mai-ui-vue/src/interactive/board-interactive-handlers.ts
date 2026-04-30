import {
  applyEmptyCellClick,
  withAppointmentSelected,
  withSlotSelected,
  type MaiInteractionSelectionState,
} from "./state";
import {
  INTERACTION_ACTIONS,
  INTERACTION_SUCCESS_EVENTS,
  MAI_BOARD_INTERACTIVE_EVENTS,
} from "../types/interactive";
import type {
  AppointmentActionEventPayload,
  AppointmentClickEventPayload,
  CreateSlotActionEventPayload,
  EmptyCellClickEventPayload,
  SlotActionEventPayload,
  SlotClickEventPayload,
  SlotRescheduleActionEventPayload,
  WeekShift,
  MaiInteractionAction,
  MaiInteractionSuccessEvent,
} from "../types";

export const BOARD_EVENT_KEYS = {
  NAVIGATE_WEEK: "onNavigate-week",
  SLOT_CLICK: "onSlot-click",
  APPOINTMENT_CLICK: "onAppointment-click",
  EMPTY_CELL_CLICK: "onEmpty-cell-click",
  RESCHEDULE_SLOT: "onReschedule-slot",
} as const;

export const CREATE_SLOT_CARD_EVENT_KEYS = {
  CREATE_SLOT: "onCreate-slot",
} as const;

export const SLOT_ACTIONS_CARD_EVENT_KEYS = {
  BOOK_SLOT: "onBook-slot",
  CANCEL_SLOT: "onCancel-slot",
  DELETE_SLOT: "onDelete-slot",
} as const;

export const APPOINTMENT_ACTIONS_CARD_EVENT_KEYS = {
  CANCEL_APPOINTMENT: "onCancel-appointment",
  DELETE_APPOINTMENT: "onDelete-appointment",
} as const;

interface BoardListenersParams {
  emit: (event: string, payload?: unknown) => void;
  setSelection: (next: MaiInteractionSelectionState) => void;
  getSelection: () => MaiInteractionSelectionState;
  clearInteractionError: () => void;
  runAction: <TPayload>(
    action: MaiInteractionAction,
    payload: TPayload,
    handler: ((payload: TPayload) => boolean | Promise<boolean>) | null,
    successEvent: MaiInteractionSuccessEvent
  ) => Promise<void>;
  rescheduleSlotHandler: ((payload: SlotRescheduleActionEventPayload) => boolean | Promise<boolean>) | null;
}

export function createBoardListeners(params: BoardListenersParams) {
  return {
    [BOARD_EVENT_KEYS.NAVIGATE_WEEK]: (shift: WeekShift) =>
      params.emit(MAI_BOARD_INTERACTIVE_EVENTS.NAVIGATE_WEEK, shift),
    [BOARD_EVENT_KEYS.SLOT_CLICK]: (payload: SlotClickEventPayload) => {
      params.setSelection(withSlotSelected(payload));
      params.clearInteractionError();
      params.emit(MAI_BOARD_INTERACTIVE_EVENTS.SLOT_CLICK, payload);
    },
    [BOARD_EVENT_KEYS.APPOINTMENT_CLICK]: (payload: AppointmentClickEventPayload) => {
      params.setSelection(withAppointmentSelected(payload));
      params.clearInteractionError();
      params.emit(MAI_BOARD_INTERACTIVE_EVENTS.APPOINTMENT_CLICK, payload);
    },
    [BOARD_EVENT_KEYS.EMPTY_CELL_CLICK]: (payload: EmptyCellClickEventPayload) => {
      params.setSelection(applyEmptyCellClick(params.getSelection(), payload));
      params.clearInteractionError();
      params.emit(MAI_BOARD_INTERACTIVE_EVENTS.EMPTY_CELL_CLICK, payload);
    },
    [BOARD_EVENT_KEYS.RESCHEDULE_SLOT]: (payload: SlotRescheduleActionEventPayload) =>
      params.runAction(
        INTERACTION_ACTIONS.RESCHEDULE_SLOT,
        payload,
        params.rescheduleSlotHandler,
        INTERACTION_SUCCESS_EVENTS.SLOT_RESCHEDULED
      ),
  };
}

export function createCreateSlotCardListeners(params: {
  runAction: <TPayload>(
    action: MaiInteractionAction,
    payload: TPayload,
    handler: ((payload: TPayload) => boolean | Promise<boolean>) | null,
    successEvent: MaiInteractionSuccessEvent
  ) => Promise<void>;
  createSlotHandler: ((payload: CreateSlotActionEventPayload) => boolean | Promise<boolean>) | null;
}) {
  return {
    [CREATE_SLOT_CARD_EVENT_KEYS.CREATE_SLOT]: (payload: CreateSlotActionEventPayload) =>
      params.runAction(
        INTERACTION_ACTIONS.CREATE_SLOT,
        payload,
        params.createSlotHandler,
        INTERACTION_SUCCESS_EVENTS.SLOT_CREATED
      ),
  };
}

export function createSlotActionsCardListeners(params: {
  runAction: <TPayload>(
    action: MaiInteractionAction,
    payload: TPayload,
    handler: ((payload: TPayload) => boolean | Promise<boolean>) | null,
    successEvent: MaiInteractionSuccessEvent
  ) => Promise<void>;
  bookSlotHandler: ((payload: SlotActionEventPayload) => boolean | Promise<boolean>) | null;
  cancelSlotHandler: ((payload: SlotActionEventPayload) => boolean | Promise<boolean>) | null;
  deleteSlotHandler: ((payload: SlotActionEventPayload) => boolean | Promise<boolean>) | null;
}) {
  return {
    [SLOT_ACTIONS_CARD_EVENT_KEYS.BOOK_SLOT]: (payload: SlotActionEventPayload) =>
      params.runAction(
        INTERACTION_ACTIONS.BOOK_SLOT,
        payload,
        params.bookSlotHandler,
        INTERACTION_SUCCESS_EVENTS.SLOT_BOOKED
      ),
    [SLOT_ACTIONS_CARD_EVENT_KEYS.CANCEL_SLOT]: (payload: SlotActionEventPayload) =>
      params.runAction(
        INTERACTION_ACTIONS.CANCEL_SLOT,
        payload,
        params.cancelSlotHandler,
        INTERACTION_SUCCESS_EVENTS.SLOT_CANCELLED
      ),
    [SLOT_ACTIONS_CARD_EVENT_KEYS.DELETE_SLOT]: (payload: SlotActionEventPayload) =>
      params.runAction(
        INTERACTION_ACTIONS.DELETE_SLOT,
        payload,
        params.deleteSlotHandler,
        INTERACTION_SUCCESS_EVENTS.SLOT_DELETED
      ),
  };
}

export function createAppointmentActionsCardListeners(params: {
  runAction: <TPayload>(
    action: MaiInteractionAction,
    payload: TPayload,
    handler: ((payload: TPayload) => boolean | Promise<boolean>) | null,
    successEvent: MaiInteractionSuccessEvent
  ) => Promise<void>;
  cancelAppointmentHandler: ((payload: AppointmentActionEventPayload) => boolean | Promise<boolean>) | null;
  deleteAppointmentHandler: ((payload: AppointmentActionEventPayload) => boolean | Promise<boolean>) | null;
}) {
  return {
    [APPOINTMENT_ACTIONS_CARD_EVENT_KEYS.CANCEL_APPOINTMENT]: (
      payload: AppointmentActionEventPayload
    ) =>
      params.runAction(
        INTERACTION_ACTIONS.CANCEL_APPOINTMENT,
        payload,
        params.cancelAppointmentHandler,
        INTERACTION_SUCCESS_EVENTS.APPOINTMENT_CANCELLED
      ),
    [APPOINTMENT_ACTIONS_CARD_EVENT_KEYS.DELETE_APPOINTMENT]: (
      payload: AppointmentActionEventPayload
    ) =>
      params.runAction(
        INTERACTION_ACTIONS.DELETE_APPOINTMENT,
        payload,
        params.deleteAppointmentHandler,
        INTERACTION_SUCCESS_EVENTS.APPOINTMENT_DELETED
      ),
  };
}
