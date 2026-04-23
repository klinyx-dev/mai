import type { WeeklyLayout } from "@mai/mai-web-core";
import { computed, defineComponent, h, ref, type PropType } from "vue";
import { MaiAppointmentActionsCard } from "./actions/MaiAppointmentActionsCard";
import { MaiCreateSlotCard } from "./actions/MaiCreateSlotCard";
import { MaiSlotActionsCard } from "./actions/MaiSlotActionsCard";
import { MaiBoard } from "./MaiBoard";
import type {
  AppointmentActionEventPayload,
  AppointmentClickEventPayload,
  CreateSlotActionEventPayload,
  EmptyCellClickEventPayload,
  MaiInteractionAction,
  MaiInteractionErrorPayload,
  SlotActionEventPayload,
  SlotClickEventPayload,
  TimeLabelFormat,
  WeekShift,
} from "./types";

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

function resolveActionError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "interaction action failed";
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
      type: Function as PropType<ActionRunner<CreateSlotActionEventPayload>>,
      required: true,
    },
    bookSlot: {
      type: Function as PropType<ActionRunner<SlotActionEventPayload>>,
      required: true,
    },
    cancelSlot: {
      type: Function as PropType<ActionRunner<SlotActionEventPayload>>,
      required: true,
    },
    deleteSlot: {
      type: Function as PropType<ActionRunner<SlotActionEventPayload>>,
      required: true,
    },
    cancelAppointment: {
      type: Function as PropType<ActionRunner<AppointmentActionEventPayload>>,
      required: true,
    },
    deleteAppointment: {
      type: Function as PropType<ActionRunner<AppointmentActionEventPayload>>,
      required: true,
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
    const pendingSlotDraft = ref<EmptyCellClickEventPayload | null>(null);
    const selectedSlot = ref<SlotClickEventPayload | null>(null);
    const selectedAppointment = ref<AppointmentClickEventPayload | null>(null);
    const actionBusy = ref(false);
    const interactionError = ref<string | null>(null);

    const activePopoverStyle = computed(() => {
      const point =
        pendingSlotDraft.value ?? selectedSlot.value ?? selectedAppointment.value ?? null;
      if (!point) {
        return {};
      }
      return popoverStyleFromPoint(point.clientX, point.clientY);
    });

    function clearSelection() {
      pendingSlotDraft.value = null;
      selectedSlot.value = null;
      selectedAppointment.value = null;
    }

    async function runAction<TPayload>(
      action: MaiInteractionAction,
      payload: TPayload,
      handler: ActionRunner<TPayload>,
      successEvent:
        | "slot-created"
        | "slot-booked"
        | "slot-cancelled"
        | "slot-deleted"
        | "appointment-cancelled"
        | "appointment-deleted"
    ) {
      actionBusy.value = true;
      interactionError.value = null;
      try {
        const ok = await handler(payload);
        if (!ok) {
          const message = "action rejected";
          interactionError.value = message;
          emit("interaction-error", { action, message });
          return;
        }
        (emit as (event: string, payload: unknown) => void)(successEvent, payload);
        clearSelection();
      } catch (error) {
        const message = resolveActionError(error);
        interactionError.value = message;
        emit("interaction-error", { action, message });
      } finally {
        actionBusy.value = false;
      }
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
              selectedSlot.value = payload;
              selectedAppointment.value = null;
              pendingSlotDraft.value = null;
              interactionError.value = null;
              emit("slot-click", payload);
            },
            "onAppointment-click": (payload: AppointmentClickEventPayload) => {
              selectedAppointment.value = payload;
              selectedSlot.value = null;
              pendingSlotDraft.value = null;
              interactionError.value = null;
              emit("appointment-click", payload);
            },
            "onEmpty-cell-click": (payload: EmptyCellClickEventPayload) => {
              pendingSlotDraft.value = payload;
              selectedSlot.value = null;
              selectedAppointment.value = null;
              interactionError.value = null;
              emit("empty-cell-click", payload);
            },
          }}
        />

        {pendingSlotDraft.value ? (
          <div class="mai-action-popover" style={activePopoverStyle.value}>
            <MaiCreateSlotCard
              draft={pendingSlotDraft.value}
              weekStartIso={props.layout?.week_start ?? props.anchorDate}
              assigneeId={props.assigneeId}
              createdBy={props.createdBy}
              defaultDurationMinutes={props.defaultSlotDurationMinutes}
              busy={actionBusy.value}
              onClose={clearSelection}
              {...{
                "onCreate-slot": (payload: CreateSlotActionEventPayload) =>
                  runAction("create-slot", payload, props.createSlot, "slot-created"),
              }}
            />
          </div>
        ) : null}

        {selectedSlot.value ? (
          <div class="mai-action-popover" style={activePopoverStyle.value}>
            <MaiSlotActionsCard
              slot={selectedSlot.value}
              busy={actionBusy.value}
              onClose={clearSelection}
              {...{
                "onBook-slot": (payload: SlotActionEventPayload) =>
                  runAction("book-slot", payload, props.bookSlot, "slot-booked"),
                "onCancel-slot": (payload: SlotActionEventPayload) =>
                  runAction("cancel-slot", payload, props.cancelSlot, "slot-cancelled"),
                "onDelete-slot": (payload: SlotActionEventPayload) =>
                  runAction("delete-slot", payload, props.deleteSlot, "slot-deleted"),
              }}
            />
          </div>
        ) : null}

        {selectedAppointment.value ? (
          <div class="mai-action-popover" style={activePopoverStyle.value}>
            <MaiAppointmentActionsCard
              appointment={selectedAppointment.value}
              busy={actionBusy.value}
              onClose={clearSelection}
              {...{
                "onCancel-appointment": (payload: AppointmentActionEventPayload) =>
                  runAction(
                    "cancel-appointment",
                    payload,
                    props.cancelAppointment,
                    "appointment-cancelled"
                  ),
                "onDelete-appointment": (payload: AppointmentActionEventPayload) =>
                  runAction(
                    "delete-appointment",
                    payload,
                    props.deleteAppointment,
                    "appointment-deleted"
                  ),
              }}
            />
          </div>
        ) : null}
      </section>
    );
  },
});
