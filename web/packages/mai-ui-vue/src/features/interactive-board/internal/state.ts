import type {
  AppointmentClickEventPayload,
  EmptyCellClickEventPayload,
  MaiInteractionAction,
  MaiInteractionErrorPayload,
  MaiInteractionSuccessEvent,
  SlotClickEventPayload,
} from "../../../types";

type ActionRunner<TPayload> = (payload: TPayload) => boolean | Promise<boolean>;

export interface MaiInteractionSelectionState {
  pendingSlotDraft: EmptyCellClickEventPayload | null;
  selectedSlot: SlotClickEventPayload | null;
  selectedAppointment: AppointmentClickEventPayload | null;
}

export type MaiInteractionOverlayKind =
  | "none"
  | "create-slot"
  | "slot-actions"
  | "appointment-actions";

export type MaiInteractionActionOutcome<TPayload> =
  | {
      nextState: MaiInteractionSelectionState;
      emittedEvent: "interaction-error";
      emittedPayload: MaiInteractionErrorPayload;
    }
  | {
      nextState: MaiInteractionSelectionState;
      emittedEvent: MaiInteractionSuccessEvent;
      emittedPayload: TPayload;
    };

export function initialSelectionState(): MaiInteractionSelectionState {
  return {
    pendingSlotDraft: null,
    selectedSlot: null,
    selectedAppointment: null,
  };
}

export function clearSelectionState(): MaiInteractionSelectionState {
  return initialSelectionState();
}

export function withSlotSelected(
  payload: SlotClickEventPayload
): MaiInteractionSelectionState {
  return {
    pendingSlotDraft: null,
    selectedSlot: payload,
    selectedAppointment: null,
  };
}

export function withAppointmentSelected(
  payload: AppointmentClickEventPayload
): MaiInteractionSelectionState {
  return {
    pendingSlotDraft: null,
    selectedSlot: null,
    selectedAppointment: payload,
  };
}

export function withEmptyCellDraft(
  payload: EmptyCellClickEventPayload
): MaiInteractionSelectionState {
  return {
    pendingSlotDraft: payload,
    selectedSlot: null,
    selectedAppointment: null,
  };
}

export function isSameEmptyCellDraft(
  left: EmptyCellClickEventPayload,
  right: EmptyCellClickEventPayload
): boolean {
  return left.dayIndex === right.dayIndex && left.minuteOfDay === right.minuteOfDay;
}

export function applyEmptyCellClick(
  state: MaiInteractionSelectionState,
  payload: EmptyCellClickEventPayload
): MaiInteractionSelectionState {
  if (state.pendingSlotDraft) {
    return clearSelectionState();
  }
  return withEmptyCellDraft(payload);
}

export function overlayKindForSelection(
  state: MaiInteractionSelectionState
): MaiInteractionOverlayKind {
  if (state.pendingSlotDraft) {
    return "create-slot";
  }
  if (state.selectedSlot) {
    return "slot-actions";
  }
  if (state.selectedAppointment) {
    return "appointment-actions";
  }
  return "none";
}

export function resolveInteractionErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "interaction action failed";
}

export async function runInteractionAction<TPayload>(
  params: Readonly<{
    action: MaiInteractionAction;
    successEvent: MaiInteractionSuccessEvent;
    payload: TPayload;
    handler: ActionRunner<TPayload> | null;
    state: MaiInteractionSelectionState;
  }>
): Promise<MaiInteractionActionOutcome<TPayload>> {
  const { action, successEvent, payload, handler, state } = params;

  if (!handler) {
    return {
      nextState: state,
      emittedEvent: "interaction-error",
      emittedPayload: {
        action,
        message: "no handler configured",
      },
    };
  }

  try {
    const ok = await handler(payload);
    if (!ok) {
      return {
        nextState: state,
        emittedEvent: "interaction-error",
        emittedPayload: {
          action,
          message: "action rejected",
        },
      };
    }

    return {
      nextState: clearSelectionState(),
      emittedEvent: successEvent,
      emittedPayload: payload,
    };
  } catch (error) {
    return {
      nextState: state,
      emittedEvent: "interaction-error",
      emittedPayload: {
        action,
        message: resolveInteractionErrorMessage(error),
      },
    };
  }
}
