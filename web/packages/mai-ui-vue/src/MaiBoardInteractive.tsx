import {
  COMMANDS,
  createCommandEnvelope,
  type AnyCommandEnvelope,
  type WeeklyLayout,
} from "@mai/mai-web-core";
import { computed, defineComponent, h, ref, type PropType } from "vue";
import { MaiAppointmentActionsCard } from "./actions/MaiAppointmentActionsCard";
import { MaiCreateSlotCard } from "./actions/MaiCreateSlotCard";
import { MaiSlotActionsCard } from "./actions/MaiSlotActionsCard";
import { MaiBoard } from "./MaiBoard";
import {
  clearSelectionState,
  initialSelectionState,
  overlayKindForSelection,
  runInteractionAction,
  withAppointmentSelected,
  withEmptyCellDraft,
  withSlotSelected,
  type MaiInteractionSelectionState,
} from "./interactive/state";
import type {
  AppointmentActionEventPayload,
  AppointmentClickEventPayload,
  CreateSlotActionEventPayload,
  EmptyCellClickEventPayload,
  MaiInteractionAction,
  MaiInteractionErrorPayload,
  MaiInteractionSuccessEvent,
  SlotActionEventPayload,
  SlotClickEventPayload,
  TimeLabelFormat,
  WeekShift,
} from "./types";
import { INTERACTION_ACTIONS, INTERACTION_SUCCESS_EVENTS } from "./types/interactive";

type ActionRunner<TPayload> = (payload: TPayload) => boolean | Promise<boolean>;

function popoverStyleFromPoint(clientX: number, clientY: number): Record<string, string> {
  const width = 340;
  const offset = 12;
  const viewportWidth =
    typeof window === "undefined" ? width + offset * 2 : window.innerWidth;
  const left = Math.min(clientX + offset, Math.max(offset, viewportWidth - width - offset));
  const top = Math.max(offset, clientY + offset);
  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
  };
}

export const MaiBoardInteractive = defineComponent({
  name: "MaiBoardInteractive",
  props: {
    layout: {
      type: Object as PropType<WeeklyLayout | null>,
      required: false,
      default: null,
    },
    title: {
      type: String,
      required: false,
      default: "Availability",
    },
    subtitle: {
      type: String,
      required: false,
      default: "Weekly clinical planning",
    },
    anchorDate: {
      type: String,
      required: true,
    },
    isLoading: {
      type: Boolean,
      required: false,
      default: false,
    },
    errorMessage: {
      type: String as PropType<string | null>,
      required: false,
      default: null,
    },
    visibleStartMinute: {
      type: Number,
      required: false,
      default: 0,
    },
    visibleEndMinute: {
      type: Number,
      required: false,
      default: 1440,
    },
    timeLabelFormat: {
      type: String as PropType<TimeLabelFormat>,
      required: false,
      default: "24h",
    },
    emptyStateText: {
      type: String,
      required: false,
      default: "No events",
    },
    assigneeId: {
      type: String,
      required: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
    defaultSlotDurationMinutes: {
      type: Number,
      required: false,
      default: 30,
    },
    createSlot: {
      type:
        Function as unknown as PropType<ActionRunner<CreateSlotActionEventPayload> | null>,
      required: false,
      default: null,
    },
    bookSlot: {
      type: Function as unknown as PropType<ActionRunner<SlotActionEventPayload> | null>,
      required: false,
      default: null,
    },
    cancelSlot: {
      type: Function as unknown as PropType<ActionRunner<SlotActionEventPayload> | null>,
      required: false,
      default: null,
    },
    deleteSlot: {
      type: Function as unknown as PropType<ActionRunner<SlotActionEventPayload> | null>,
      required: false,
      default: null,
    },
    cancelAppointment: {
      type:
        Function as unknown as PropType<ActionRunner<AppointmentActionEventPayload> | null>,
      required: false,
      default: null,
    },
    deleteAppointment: {
      type:
        Function as unknown as PropType<ActionRunner<AppointmentActionEventPayload> | null>,
      required: false,
      default: null,
    },
    mutateCommand: {
      type: Function as unknown as PropType<ActionRunner<AnyCommandEnvelope> | null>,
      required: false,
      default: null,
    },
    appointmentIdFactory: {
      type: Function as PropType<(slotId: string) => string>,
      required: false,
      default: (slotId: string) => `appt-${slotId}-${Date.now()}`,
    },
    bookAppointmentInviteeIds: {
      type: Array as PropType<string[]>,
      required: false,
      default: () => [],
    },
    bookAppointmentTitle: {
      type: String,
      required: false,
      default: "Consultation",
    },
    bookAppointmentCreatedBy: {
      type: String,
      required: false,
      default: "",
    },
    cancelAppointmentBy: {
      type: String,
      required: false,
      default: "",
    },
  },
  emits: {
    "navigate-week": (shift: WeekShift) => shift === -1 || shift === 0 || shift === 1,
    "slot-click": (payload: SlotClickEventPayload) => typeof payload.slotId === "string",
    "appointment-click": (payload: AppointmentClickEventPayload) =>
      typeof payload.appointmentId === "string",
    "empty-cell-click": (payload: EmptyCellClickEventPayload) =>
      Number.isInteger(payload.dayIndex),
    "slot-created": (payload: CreateSlotActionEventPayload) => typeof payload.slotId === "string",
    "slot-booked": (payload: SlotActionEventPayload) => typeof payload.slotId === "string",
    "slot-cancelled": (payload: SlotActionEventPayload) => typeof payload.slotId === "string",
    "slot-deleted": (payload: SlotActionEventPayload) => typeof payload.slotId === "string",
    "appointment-cancelled": (payload: AppointmentActionEventPayload) =>
      typeof payload.appointmentId === "string",
    "appointment-deleted": (payload: AppointmentActionEventPayload) =>
      typeof payload.appointmentId === "string",
    "interaction-error": (payload: MaiInteractionErrorPayload) =>
      typeof payload.action === "string" && typeof payload.message === "string",
  },
  setup(props, { emit }) {
    const selection = ref<MaiInteractionSelectionState>(initialSelectionState());
    const actionBusy = ref(false);
    const interactionError = ref<string | null>(null);

    const activePopoverStyle = computed(() => {
      const point =
        selection.value.pendingSlotDraft ??
        selection.value.selectedSlot ??
        selection.value.selectedAppointment ??
        null;
      if (!point) {
        return {};
      }
      return popoverStyleFromPoint(point.clientX, point.clientY);
    });

    function clearSelection() {
      selection.value = clearSelectionState();
    }

    const runCommand = async (command: AnyCommandEnvelope): Promise<boolean> => {
      if (!props.mutateCommand) {
        return false;
      }
      return await props.mutateCommand(command);
    };

    const createSlotHandler: ActionRunner<CreateSlotActionEventPayload> | null =
      props.createSlot ??
      (props.mutateCommand
        ? async (payload) =>
            runCommand(
              createCommandEnvelope(COMMANDS.ADD_SLOT, {
                slot_id: payload.slotId,
                start: payload.startIso,
                end: payload.endIso,
                assignee_id: payload.assigneeId,
                created_by: payload.createdBy,
              })
            )
        : null);

    const bookSlotHandler: ActionRunner<SlotActionEventPayload> | null =
      props.bookSlot ??
      (props.mutateCommand
        ? async (payload) =>
            runCommand(
              createCommandEnvelope(COMMANDS.ADD_APPOINTMENT, {
                appointment_id: props.appointmentIdFactory(payload.slotId),
                slot_id: payload.slotId,
                invitee_ids: props.bookAppointmentInviteeIds,
                title: props.bookAppointmentTitle,
                created_by: props.bookAppointmentCreatedBy || props.createdBy,
              })
            )
        : null);

    const cancelSlotHandler: ActionRunner<SlotActionEventPayload> | null =
      props.cancelSlot ??
      (props.mutateCommand
        ? async (payload) =>
            runCommand(
              createCommandEnvelope(COMMANDS.CANCEL_SLOT, {
                slot_id: payload.slotId,
              })
            )
        : null);

    const deleteSlotHandler: ActionRunner<SlotActionEventPayload> | null =
      props.deleteSlot ??
      (props.mutateCommand
        ? async (payload) =>
            runCommand(
              createCommandEnvelope(COMMANDS.DELETE_SLOT, {
                slot_id: payload.slotId,
              })
            )
        : null);

    const cancelAppointmentHandler: ActionRunner<AppointmentActionEventPayload> | null =
      props.cancelAppointment ??
      (props.mutateCommand
        ? async (payload) =>
            runCommand(
              createCommandEnvelope(COMMANDS.CANCEL_APPOINTMENT, {
                appointment_id: payload.appointmentId,
                cancelled_by: props.cancelAppointmentBy || props.createdBy,
              })
            )
        : null);

    const deleteAppointmentHandler: ActionRunner<AppointmentActionEventPayload> | null =
      props.deleteAppointment ??
      (props.mutateCommand
        ? async (payload) =>
            runCommand(
              createCommandEnvelope(COMMANDS.DELETE_APPOINTMENT, {
                appointment_id: payload.appointmentId,
              })
            )
        : null);

    async function runAction<TPayload>(
      action: MaiInteractionAction,
      payload: TPayload,
      handler: ActionRunner<TPayload> | null,
      successEvent: MaiInteractionSuccessEvent
    ) {
      actionBusy.value = true;
      interactionError.value = null;
      const outcome = await runInteractionAction({
        action,
        successEvent,
        payload,
        handler,
        state: selection.value,
      });
      if (outcome.emittedEvent === "interaction-error") {
        interactionError.value = outcome.emittedPayload.message;
        emit("interaction-error", outcome.emittedPayload);
      } else {
        selection.value = outcome.nextState;
        (emit as (event: string, payload: unknown) => void)(
          outcome.emittedEvent,
          outcome.emittedPayload
        );
      }
      actionBusy.value = false;
    }

    return () => (
      <section class="mai-board-interactive">
        {interactionError.value ? <p class="mai-board__error">{interactionError.value}</p> : null}
        <MaiBoard
          layout={props.layout}
          title={props.title}
          subtitle={props.subtitle}
          anchorDate={props.anchorDate}
          isLoading={props.isLoading}
          errorMessage={props.errorMessage}
          visibleStartMinute={props.visibleStartMinute}
          visibleEndMinute={props.visibleEndMinute}
          timeLabelFormat={props.timeLabelFormat}
          emptyStateText={props.emptyStateText}
          showActionOverlay={false}
          {...{
            "onNavigate-week": (shift: WeekShift) => emit("navigate-week", shift),
            "onSlot-click": (payload: SlotClickEventPayload) => {
              selection.value = withSlotSelected(payload);
              interactionError.value = null;
              emit("slot-click", payload);
            },
            "onAppointment-click": (payload: AppointmentClickEventPayload) => {
              selection.value = withAppointmentSelected(payload);
              interactionError.value = null;
              emit("appointment-click", payload);
            },
            "onEmpty-cell-click": (payload: EmptyCellClickEventPayload) => {
              selection.value = withEmptyCellDraft(payload);
              interactionError.value = null;
              emit("empty-cell-click", payload);
            },
          }}
        />

        {overlayKindForSelection(selection.value) === "create-slot" &&
        selection.value.pendingSlotDraft ? (
          <div class="mai-action-popover" style={activePopoverStyle.value}>
            <MaiCreateSlotCard
              draft={selection.value.pendingSlotDraft}
              weekStartIso={props.layout?.week_start ?? props.anchorDate}
              assigneeId={props.assigneeId}
              createdBy={props.createdBy}
              defaultDurationMinutes={props.defaultSlotDurationMinutes}
              busy={actionBusy.value}
              onClose={clearSelection}
              {...{
                "onCreate-slot": (payload: CreateSlotActionEventPayload) =>
                  runAction(
                    INTERACTION_ACTIONS.CREATE_SLOT,
                    payload,
                    createSlotHandler,
                    INTERACTION_SUCCESS_EVENTS.SLOT_CREATED
                  ),
              }}
            />
          </div>
        ) : null}

        {overlayKindForSelection(selection.value) === "slot-actions" &&
        selection.value.selectedSlot ? (
          <div class="mai-action-popover" style={activePopoverStyle.value}>
            <MaiSlotActionsCard
              slot={selection.value.selectedSlot}
              busy={actionBusy.value}
              onClose={clearSelection}
              {...{
                "onBook-slot": (payload: SlotActionEventPayload) =>
                  runAction(
                    INTERACTION_ACTIONS.BOOK_SLOT,
                    payload,
                    bookSlotHandler,
                    INTERACTION_SUCCESS_EVENTS.SLOT_BOOKED
                  ),
                "onCancel-slot": (payload: SlotActionEventPayload) =>
                  runAction(
                    INTERACTION_ACTIONS.CANCEL_SLOT,
                    payload,
                    cancelSlotHandler,
                    INTERACTION_SUCCESS_EVENTS.SLOT_CANCELLED
                  ),
                "onDelete-slot": (payload: SlotActionEventPayload) =>
                  runAction(
                    INTERACTION_ACTIONS.DELETE_SLOT,
                    payload,
                    deleteSlotHandler,
                    INTERACTION_SUCCESS_EVENTS.SLOT_DELETED
                  ),
              }}
            />
          </div>
        ) : null}

        {overlayKindForSelection(selection.value) === "appointment-actions" &&
        selection.value.selectedAppointment ? (
          <div class="mai-action-popover" style={activePopoverStyle.value}>
            <MaiAppointmentActionsCard
              appointment={selection.value.selectedAppointment}
              busy={actionBusy.value}
              onClose={clearSelection}
              {...{
                "onCancel-appointment": (payload: AppointmentActionEventPayload) =>
                  runAction(
                    INTERACTION_ACTIONS.CANCEL_APPOINTMENT,
                    payload,
                    cancelAppointmentHandler,
                    INTERACTION_SUCCESS_EVENTS.APPOINTMENT_CANCELLED
                  ),
                "onDelete-appointment": (payload: AppointmentActionEventPayload) =>
                  runAction(
                    INTERACTION_ACTIONS.DELETE_APPOINTMENT,
                    payload,
                    deleteAppointmentHandler,
                    INTERACTION_SUCCESS_EVENTS.APPOINTMENT_DELETED
                  ),
              }}
            />
          </div>
        ) : null}
      </section>
    );
  },
});
