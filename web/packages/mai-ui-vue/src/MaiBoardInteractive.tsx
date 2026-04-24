import { type AnyCommandEnvelope, type WeeklyLayout } from "@mai/mai-web-core";
import { computed, defineComponent, h, ref, type PropType } from "vue";
import { MaiAppointmentActionsCard } from "./actions/MaiAppointmentActionsCard";
import { MaiCreateSlotCard } from "./actions/MaiCreateSlotCard";
import { MaiSlotActionsCard } from "./actions/MaiSlotActionsCard";
import { MaiBoard } from "./MaiBoard";
import {
  applyEmptyCellClick,
  buildAddAppointmentCommand,
  buildAddSlotCommand,
  buildCancelAppointmentCommand,
  buildCancelSlotCommand,
  buildDeleteAppointmentCommand,
  buildDeleteSlotCommand,
  buildRescheduleSlotCommand,
  clearSelectionState,
  initialSelectionState,
  overlayKindForSelection,
  runInteractionAction,
  withAppointmentSelected,
  withSlotSelected,
  type CommandModeOptions,
  type MaiInteractionSelectionState,
} from "./interactive";
import type {
  AppointmentActionEventPayload,
  AppointmentClickEventPayload,
  CreateSlotActionEventPayload,
  EmptyCellClickEventPayload,
  MaiActionRunner,
  MaiBoardInteractiveActionConfig,
  MaiBoardInteractiveActorConfig,
  MaiBoardInteractiveViewConfig,
  MaiInteractionAction,
  MaiInteractionErrorPayload,
  MaiInteractionSuccessEvent,
  SlotActionEventPayload,
  SlotClickEventPayload,
  SlotRescheduleActionEventPayload,
  TimeLabelFormat,
  WeekShift,
} from "./types";
import { INTERACTION_ACTIONS, INTERACTION_SUCCESS_EVENTS } from "./types/interactive";
import { MIN_SLOT_SPAN_MINUTES } from "./board/model/slot-gesture";
import { startOfWeekIso } from "./board/model/view-model";
import type { InteractionAnchorRect } from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function buildDraftAnchorRect(params: {
  columnRect: InteractionAnchorRect;
  minuteOfDay: number;
  durationMinutes: number;
  visibleStartMinute: number;
  visibleEndMinute: number;
}): InteractionAnchorRect {
  const horizontalInset = 8;
  const startMinute = clamp(params.minuteOfDay, params.visibleStartMinute, params.visibleEndMinute);
  const endMinute = clamp(
    startMinute + Math.max(params.durationMinutes, MIN_SLOT_SPAN_MINUTES),
    params.visibleStartMinute,
    params.visibleEndMinute
  );
  const visibleMinutes = Math.max(params.visibleEndMinute - params.visibleStartMinute, 1);
  const topRatio = (startMinute - params.visibleStartMinute) / visibleMinutes;
  const heightRatio =
    Math.max(endMinute - startMinute, MIN_SLOT_SPAN_MINUTES) / visibleMinutes;

  return {
    left: params.columnRect.left + horizontalInset,
    top: params.columnRect.top + params.columnRect.height * topRatio,
    width: Math.max(params.columnRect.width - horizontalInset * 2, 120),
    height: Math.max(params.columnRect.height * heightRatio, 18),
  };
}

function popoverStyleFromAnchorRect(anchorRect: InteractionAnchorRect): Record<string, string> {
  const width = 340;
  const offset = 12;
  const viewportWidth =
    typeof window === "undefined" ? width + offset * 2 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 720 : window.innerHeight;
  const popoverWidth = Math.min(width, Math.max(240, viewportWidth - offset * 2));
  const popoverHeight = 280;
  const anchorRight = anchorRect.left + anchorRect.width;
  const anchorMidY = anchorRect.top + anchorRect.height / 2;
  const spaceOnRight = viewportWidth - anchorRight;
  const spaceOnLeft = anchorRect.left;

  const shouldPlaceRight =
    spaceOnRight >= popoverWidth + offset ||
    (spaceOnRight >= spaceOnLeft && spaceOnLeft < popoverWidth + offset);
  const rawLeft = shouldPlaceRight
    ? anchorRight + offset
    : anchorRect.left - popoverWidth - offset;
  const left = Math.min(
    Math.max(rawLeft, offset),
    Math.max(offset, viewportWidth - popoverWidth - offset)
  );

  const rawTop = anchorMidY - 20;
  const top = Math.min(
    Math.max(rawTop, offset),
    Math.max(offset, viewportHeight - popoverHeight - offset)
  );
  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${popoverWidth}px`,
  };
}

type PartialViewConfig = Partial<MaiBoardInteractiveViewConfig>;
type PartialActorConfig = Partial<MaiBoardInteractiveActorConfig>;
type PartialActionConfig = Partial<MaiBoardInteractiveActionConfig>;

export const MaiBoardInteractive = defineComponent({
  name: "MaiBoardInteractive",
  props: {
    layout: {
      type: Object as PropType<WeeklyLayout | null>,
      required: false,
      default: null,
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

    // Preferred grouped configuration API.
    view: {
      type: Object as PropType<PartialViewConfig | null>,
      required: false,
      default: null,
    },
    actor: {
      type: Object as PropType<PartialActorConfig | null>,
      required: false,
      default: null,
    },
    actions: {
      type: Object as PropType<PartialActionConfig | null>,
      required: false,
      default: null,
    },

    // Backward-compatible flat props.
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
      required: false,
      default: "",
    },
    createdBy: {
      type: String,
      required: false,
      default: "",
    },
    defaultSlotDurationMinutes: {
      type: Number,
      required: false,
      default: 30,
    },
    createSlot: {
      type:
        Function as unknown as PropType<MaiActionRunner<CreateSlotActionEventPayload> | null>,
      required: false,
      default: null,
    },
    bookSlot: {
      type: Function as unknown as PropType<MaiActionRunner<SlotActionEventPayload> | null>,
      required: false,
      default: null,
    },
    rescheduleSlot: {
      type:
        Function as unknown as PropType<MaiActionRunner<SlotRescheduleActionEventPayload> | null>,
      required: false,
      default: null,
    },
    cancelSlot: {
      type: Function as unknown as PropType<MaiActionRunner<SlotActionEventPayload> | null>,
      required: false,
      default: null,
    },
    deleteSlot: {
      type: Function as unknown as PropType<MaiActionRunner<SlotActionEventPayload> | null>,
      required: false,
      default: null,
    },
    cancelAppointment: {
      type:
        Function as unknown as PropType<MaiActionRunner<AppointmentActionEventPayload> | null>,
      required: false,
      default: null,
    },
    deleteAppointment: {
      type:
        Function as unknown as PropType<MaiActionRunner<AppointmentActionEventPayload> | null>,
      required: false,
      default: null,
    },
    mutateCommand: {
      type: Function as unknown as PropType<MaiActionRunner<AnyCommandEnvelope> | null>,
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
    "slot-rescheduled": (payload: SlotRescheduleActionEventPayload) =>
      typeof payload.slotId === "string",
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

    const resolvedView = computed(() => ({
      title: props.view?.title ?? props.title,
      subtitle: props.view?.subtitle ?? props.subtitle,
      visibleStartMinute: props.view?.visibleStartMinute ?? props.visibleStartMinute,
      visibleEndMinute: props.view?.visibleEndMinute ?? props.visibleEndMinute,
      timeLabelFormat: props.view?.timeLabelFormat ?? props.timeLabelFormat,
      emptyStateText: props.view?.emptyStateText ?? props.emptyStateText,
    }));

    const resolvedActor = computed(() => ({
      assigneeId: props.actor?.assigneeId ?? props.assigneeId,
      createdBy: props.actor?.createdBy ?? props.createdBy,
      defaultSlotDurationMinutes:
        props.actor?.defaultSlotDurationMinutes ?? props.defaultSlotDurationMinutes,
      appointmentIdFactory:
        props.actor?.appointmentIdFactory ?? props.appointmentIdFactory,
      bookAppointmentInviteeIds:
        props.actor?.bookAppointmentInviteeIds ?? props.bookAppointmentInviteeIds,
      bookAppointmentTitle:
        props.actor?.bookAppointmentTitle ?? props.bookAppointmentTitle,
      bookAppointmentCreatedBy:
        props.actor?.bookAppointmentCreatedBy ?? props.bookAppointmentCreatedBy,
      cancelAppointmentBy:
        props.actor?.cancelAppointmentBy ?? props.cancelAppointmentBy,
    }));

    const resolvedActions = computed(() => props.actions ?? null);

    const resolvedMutateCommand = computed(() => {
      const groupedMutate = resolvedActions.value?.mutateCommand;
      return groupedMutate ?? props.mutateCommand;
    });

    const activePopoverStyle = computed(() => {
      if (selection.value.selectedSlot) {
        return popoverStyleFromAnchorRect(selection.value.selectedSlot.anchorRect);
      }
      if (selection.value.selectedAppointment) {
        return popoverStyleFromAnchorRect(selection.value.selectedAppointment.anchorRect);
      }
      if (selection.value.pendingSlotDraft) {
        const anchorRect = buildDraftAnchorRect({
          columnRect: selection.value.pendingSlotDraft.columnRect,
          minuteOfDay: selection.value.pendingSlotDraft.minuteOfDay,
          durationMinutes: resolvedActor.value.defaultSlotDurationMinutes,
          visibleStartMinute: resolvedView.value.visibleStartMinute,
          visibleEndMinute: resolvedView.value.visibleEndMinute,
        });
        return popoverStyleFromAnchorRect(anchorRect);
      }
      if (!selection.value.pendingSlotDraft) {
        return {};
      }
      return {};
    });

    const previewSlotDraft = computed(() => {
      if (!selection.value.pendingSlotDraft) {
        return null;
      }
      const startMinute = Math.max(0, Math.min(1440, selection.value.pendingSlotDraft.minuteOfDay));
      const endMinute = Math.max(
        startMinute + MIN_SLOT_SPAN_MINUTES,
        Math.min(1440, startMinute + resolvedActor.value.defaultSlotDurationMinutes)
      );
      return {
        dayIndex: selection.value.pendingSlotDraft.dayIndex,
        startMinute,
        endMinute,
      };
    });

    function clearSelection() {
      selection.value = clearSelectionState();
    }

    const runCommand = async (command: AnyCommandEnvelope): Promise<boolean> => {
      const mutate = resolvedMutateCommand.value;
      if (!mutate) {
        return false;
      }
      return await mutate(command);
    };

    const commandModeOptions = computed<CommandModeOptions>(() => ({
      createdBy: resolvedActor.value.createdBy,
      appointmentIdFactory: resolvedActor.value.appointmentIdFactory,
      bookAppointmentInviteeIds: resolvedActor.value.bookAppointmentInviteeIds,
      bookAppointmentTitle: resolvedActor.value.bookAppointmentTitle,
      bookAppointmentCreatedBy: resolvedActor.value.bookAppointmentCreatedBy,
      cancelAppointmentBy: resolvedActor.value.cancelAppointmentBy,
      weekStartIso: props.layout?.week_start ?? startOfWeekIso(props.anchorDate),
    }));

    const createSlotHandler = computed<MaiActionRunner<CreateSlotActionEventPayload> | null>(
      () =>
        resolvedActions.value?.createSlot ??
        props.createSlot ??
        (resolvedMutateCommand.value
          ? async (payload) => runCommand(buildAddSlotCommand(payload))
          : null)
    );

    const bookSlotHandler = computed<MaiActionRunner<SlotActionEventPayload> | null>(
      () =>
        resolvedActions.value?.bookSlot ??
        props.bookSlot ??
        (resolvedMutateCommand.value
          ? async (payload) =>
              runCommand(buildAddAppointmentCommand(payload, commandModeOptions.value))
          : null)
    );

    const rescheduleSlotHandler = computed<
      MaiActionRunner<SlotRescheduleActionEventPayload> | null
    >(
      () =>
        resolvedActions.value?.rescheduleSlot ??
        props.rescheduleSlot ??
        (resolvedMutateCommand.value
          ? async (payload) =>
              runCommand(buildRescheduleSlotCommand(payload, commandModeOptions.value))
          : null)
    );

    const cancelSlotHandler = computed<MaiActionRunner<SlotActionEventPayload> | null>(
      () =>
        resolvedActions.value?.cancelSlot ??
        props.cancelSlot ??
        (resolvedMutateCommand.value
          ? async (payload) => runCommand(buildCancelSlotCommand(payload))
          : null)
    );

    const deleteSlotHandler = computed<MaiActionRunner<SlotActionEventPayload> | null>(
      () =>
        resolvedActions.value?.deleteSlot ??
        props.deleteSlot ??
        (resolvedMutateCommand.value
          ? async (payload) => runCommand(buildDeleteSlotCommand(payload))
          : null)
    );

    const cancelAppointmentHandler = computed<
      MaiActionRunner<AppointmentActionEventPayload> | null
    >(
      () =>
        resolvedActions.value?.cancelAppointment ??
        props.cancelAppointment ??
        (resolvedMutateCommand.value
          ? async (payload) =>
              runCommand(buildCancelAppointmentCommand(payload, commandModeOptions.value))
          : null)
    );

    const deleteAppointmentHandler = computed<
      MaiActionRunner<AppointmentActionEventPayload> | null
    >(
      () =>
        resolvedActions.value?.deleteAppointment ??
        props.deleteAppointment ??
        (resolvedMutateCommand.value
          ? async (payload) => runCommand(buildDeleteAppointmentCommand(payload))
          : null)
    );

    async function runAction<TPayload>(
      action: MaiInteractionAction,
      payload: TPayload,
      handler: MaiActionRunner<TPayload> | null,
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
          title={resolvedView.value.title}
          subtitle={resolvedView.value.subtitle}
          anchorDate={props.anchorDate}
          isLoading={props.isLoading}
          errorMessage={props.errorMessage}
          visibleStartMinute={resolvedView.value.visibleStartMinute}
          visibleEndMinute={resolvedView.value.visibleEndMinute}
          timeLabelFormat={resolvedView.value.timeLabelFormat}
          emptyStateText={resolvedView.value.emptyStateText}
          previewSlotDraft={previewSlotDraft.value}
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
              selection.value = applyEmptyCellClick(selection.value, payload);
              interactionError.value = null;
              emit("empty-cell-click", payload);
            },
            "onReschedule-slot": (payload: SlotRescheduleActionEventPayload) =>
              runAction(
                INTERACTION_ACTIONS.RESCHEDULE_SLOT,
                payload,
                rescheduleSlotHandler.value,
                INTERACTION_SUCCESS_EVENTS.SLOT_RESCHEDULED
              ),
          }}
        />

        {overlayKindForSelection(selection.value) === "create-slot" &&
        selection.value.pendingSlotDraft ? (
          <div class="mai-action-popover" style={activePopoverStyle.value}>
            <MaiCreateSlotCard
              draft={selection.value.pendingSlotDraft}
              weekStartIso={props.layout?.week_start ?? props.anchorDate}
              assigneeId={resolvedActor.value.assigneeId}
              createdBy={resolvedActor.value.createdBy}
              defaultDurationMinutes={resolvedActor.value.defaultSlotDurationMinutes}
              busy={actionBusy.value}
              onClose={clearSelection}
              {...{
                "onCreate-slot": (payload: CreateSlotActionEventPayload) =>
                  runAction(
                    INTERACTION_ACTIONS.CREATE_SLOT,
                    payload,
                    createSlotHandler.value,
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
                    bookSlotHandler.value,
                    INTERACTION_SUCCESS_EVENTS.SLOT_BOOKED
                  ),
                "onCancel-slot": (payload: SlotActionEventPayload) =>
                  runAction(
                    INTERACTION_ACTIONS.CANCEL_SLOT,
                    payload,
                    cancelSlotHandler.value,
                    INTERACTION_SUCCESS_EVENTS.SLOT_CANCELLED
                  ),
                "onDelete-slot": (payload: SlotActionEventPayload) =>
                  runAction(
                    INTERACTION_ACTIONS.DELETE_SLOT,
                    payload,
                    deleteSlotHandler.value,
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
                    cancelAppointmentHandler.value,
                    INTERACTION_SUCCESS_EVENTS.APPOINTMENT_CANCELLED
                  ),
                "onDelete-appointment": (payload: AppointmentActionEventPayload) =>
                  runAction(
                    INTERACTION_ACTIONS.DELETE_APPOINTMENT,
                    payload,
                    deleteAppointmentHandler.value,
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
