import { type WeeklyLayout } from "@mai/mai-web-core";
import { computed, defineComponent, h, ref } from "vue";
import { MaiAppointmentActionsCard } from "./actions/MaiAppointmentActionsCard";
import { MaiCreateSlotCard } from "./actions/MaiCreateSlotCard";
import { MaiSlotActionsCard } from "./actions/MaiSlotActionsCard";
import { MaiBoard } from "./MaiBoard";
import {
  applyEmptyCellClick,
  clearSelectionState,
  initialSelectionState,
  overlayKindForSelection,
  runInteractionAction,
  withAppointmentSelected,
  withSlotSelected,
  type MaiInteractionSelectionState,
} from "./interactive";
import {
  buildActivePopoverStyle,
  buildPreviewSlotDraft,
} from "./interactive/overlay";
import {
  buildBookSlotHandler,
  buildCancelAppointmentHandler,
  buildCancelSlotHandler,
  buildCommandModeOptions,
  buildCreateSlotHandler,
  buildDeleteAppointmentHandler,
  buildDeleteSlotHandler,
  buildResolvedActor,
  buildResolvedMutateCommand,
  buildResolvedView,
  buildRescheduleSlotHandler,
  buildWeekStartIso,
} from "./interactive/resolved-config";
import {
  createAppointmentActionsCardListeners,
  createBoardListeners,
  createCreateSlotCardListeners,
  createSlotActionsCardListeners,
} from "./interactive/board-interactive-handlers";
import {
  maiBoardInteractiveEmits,
  maiBoardInteractiveProps,
} from "./interactive/board-interactive-contract";
import { MAI_BOARD_INTERACTIVE_EVENTS } from "./types/interactive";
import type {
  MaiActionRunner,
  MaiInteractionAction,
  MaiInteractionSuccessEvent,
} from "./types";

export const MaiBoardInteractive = defineComponent({
  name: "MaiBoardInteractive",
  props: maiBoardInteractiveProps,
  emits: maiBoardInteractiveEmits,
  setup(props, { emit }) {
    const selection = ref<MaiInteractionSelectionState>(initialSelectionState());
    const actionBusy = ref(false);
    const interactionError = ref<string | null>(null);

    const resolvedView = buildResolvedView({
      view: props.view,
    });

    const resolvedActor = buildResolvedActor({
      actor: props.actor,
    });

    const resolvedActions = computed(() => props.actions ?? null);
    const resolvedMutateCommand = buildResolvedMutateCommand({
      actions: resolvedActions,
    });

    const weekStartIso = buildWeekStartIso({
      layoutWeekStart: computed(() => props.layout?.week_start ?? null),
      anchorDate: props.anchorDate,
    });
    const commandModeOptions = buildCommandModeOptions({
      actor: resolvedActor,
      weekStartIso,
    });

    const createSlotHandler = buildCreateSlotHandler({
      actions: resolvedActions,
      mutate: resolvedMutateCommand,
    });
    const bookSlotHandler = buildBookSlotHandler({
      actions: resolvedActions,
      mutate: resolvedMutateCommand,
      options: commandModeOptions,
    });
    const rescheduleSlotHandler = buildRescheduleSlotHandler({
      actions: resolvedActions,
      mutate: resolvedMutateCommand,
      options: commandModeOptions,
    });
    const cancelSlotHandler = buildCancelSlotHandler({
      actions: resolvedActions,
      mutate: resolvedMutateCommand,
    });
    const deleteSlotHandler = buildDeleteSlotHandler({
      actions: resolvedActions,
      mutate: resolvedMutateCommand,
    });
    const cancelAppointmentHandler = buildCancelAppointmentHandler({
      actions: resolvedActions,
      mutate: resolvedMutateCommand,
      options: commandModeOptions,
    });
    const deleteAppointmentHandler = buildDeleteAppointmentHandler({
      actions: resolvedActions,
      mutate: resolvedMutateCommand,
    });

    const activePopoverStyle = computed(() =>
      buildActivePopoverStyle({
        selection: selection.value,
        defaultSlotDurationMinutes: resolvedActor.value.defaultSlotDurationMinutes,
        visibleStartMinute: resolvedView.value.visibleStartMinute,
        visibleEndMinute: resolvedView.value.visibleEndMinute,
      })
    );

    const previewSlotDraft = computed(() =>
      buildPreviewSlotDraft({
        selection: selection.value,
        defaultSlotDurationMinutes: resolvedActor.value.defaultSlotDurationMinutes,
      })
    );

    function clearSelection() {
      selection.value = clearSelectionState();
    }

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
      if (outcome.emittedEvent === MAI_BOARD_INTERACTIVE_EVENTS.INTERACTION_ERROR) {
        interactionError.value = outcome.emittedPayload.message;
        emit(MAI_BOARD_INTERACTIVE_EVENTS.INTERACTION_ERROR, outcome.emittedPayload);
      } else {
        selection.value = outcome.nextState;
        (emit as (event: string, payload: unknown) => void)(
          outcome.emittedEvent,
          outcome.emittedPayload
        );
      }
      actionBusy.value = false;
    }

    const boardListeners = computed(() =>
      createBoardListeners({
        emit: emit as (event: string, payload?: unknown) => void,
        setSelection: (next) => {
          selection.value = next;
        },
        getSelection: () => selection.value,
        clearInteractionError: () => {
          interactionError.value = null;
        },
        runAction,
        rescheduleSlotHandler: rescheduleSlotHandler.value,
      })
    );

    const createSlotCardListeners = computed(() =>
      createCreateSlotCardListeners({
        runAction,
        createSlotHandler: createSlotHandler.value,
      })
    );

    const slotActionsCardListeners = computed(() =>
      createSlotActionsCardListeners({
        runAction,
        bookSlotHandler: bookSlotHandler.value,
        cancelSlotHandler: cancelSlotHandler.value,
        deleteSlotHandler: deleteSlotHandler.value,
      })
    );

    const appointmentActionsCardListeners = computed(() =>
      createAppointmentActionsCardListeners({
        runAction,
        cancelAppointmentHandler: cancelAppointmentHandler.value,
        deleteAppointmentHandler: deleteAppointmentHandler.value,
      })
    );

    return () => (
      <section
        class="mai-board-interactive"
        data-view-filter-mode={props.viewFilter?.mode ?? "all"}
      >
        {interactionError.value ? <p class="mai-board__error">{interactionError.value}</p> : null}
        <MaiBoard
          layout={props.layout as WeeklyLayout | null}
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
          {...boardListeners.value}
        />

        {overlayKindForSelection(selection.value) === "create-slot" &&
        selection.value.pendingSlotDraft ? (
          <div class="mai-action-popover" style={activePopoverStyle.value}>
            <MaiCreateSlotCard
              draft={selection.value.pendingSlotDraft}
              weekStartIso={props.layout?.week_start ?? props.anchorDate}
              resourceOwnerId={resolvedActor.value.resourceOwnerId}
              createdBy={resolvedActor.value.createdBy}
              defaultDurationMinutes={resolvedActor.value.defaultSlotDurationMinutes}
              busy={actionBusy.value}
              onClose={clearSelection}
              {...createSlotCardListeners.value}
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
              {...slotActionsCardListeners.value}
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
              {...appointmentActionsCardListeners.value}
            />
          </div>
        ) : null}
      </section>
    );
  },
});
