import { computed, defineComponent, h, type PropType } from "vue";
import type {
  AppointmentActionEventPayload,
  AppointmentClickEventPayload,
  CreateSlotActionEventPayload,
  EmptyCellClickEventPayload,
  SlotActionEventPayload,
  SlotClickEventPayload,
} from "../../types";
import { MaiAppointmentActionsCard } from "../../actions/MaiAppointmentActionsCard";
import { MaiCreateSlotCard } from "../../actions/MaiCreateSlotCard";
import { MaiSlotActionsCard } from "../../actions/MaiSlotActionsCard";

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

export const MaiActionOverlay = defineComponent({
  name: "MaiActionOverlay",
  props: {
    show: { type: Boolean, required: true },
    pendingSlotDraft: {
      type: null as unknown as PropType<EmptyCellClickEventPayload | null>,
      required: false,
      default: null,
    },
    selectedSlot: {
      type: null as unknown as PropType<SlotClickEventPayload | null>,
      required: false,
      default: null,
    },
    selectedAppointment: {
      type: null as unknown as PropType<AppointmentClickEventPayload | null>,
      required: false,
      default: null,
    },
    weekStartIso: { type: String, required: true },
    actionAssigneeId: { type: String, required: true },
    actionCreatedBy: { type: String, required: true },
    defaultSlotDurationMinutes: { type: Number, required: true },
    actionBusy: { type: Boolean, required: true },
    onCreateSlot: {
      type: Function as PropType<(payload: CreateSlotActionEventPayload) => void>,
      required: true,
    },
    onBookSlot: {
      type: Function as PropType<(payload: SlotActionEventPayload) => void>,
      required: true,
    },
    onCancelSlot: {
      type: Function as PropType<(payload: SlotActionEventPayload) => void>,
      required: true,
    },
    onDeleteSlot: {
      type: Function as PropType<(payload: SlotActionEventPayload) => void>,
      required: true,
    },
    onCancelAppointment: {
      type: Function as PropType<(payload: AppointmentActionEventPayload) => void>,
      required: true,
    },
    onDeleteAppointment: {
      type: Function as PropType<(payload: AppointmentActionEventPayload) => void>,
      required: true,
    },
    onClear: { type: Function as PropType<() => void>, required: true },
  },
  setup(props) {
    const activePopoverStyle = computed(() => {
      const point =
        props.pendingSlotDraft ?? props.selectedSlot ?? props.selectedAppointment ?? null;
      if (!point) {
        return {};
      }
      return popoverStyleFromPoint(point.clientX, point.clientY);
    });

    return () => {
      if (!props.show) {
        return null;
      }

      if (
        props.pendingSlotDraft &&
        props.actionAssigneeId &&
        props.actionCreatedBy
      ) {
        return (
          <div class="mai-action-popover" style={activePopoverStyle.value}>
            <MaiCreateSlotCard
              draft={props.pendingSlotDraft}
              weekStartIso={props.weekStartIso}
              assigneeId={props.actionAssigneeId}
              createdBy={props.actionCreatedBy}
              defaultDurationMinutes={props.defaultSlotDurationMinutes}
              busy={props.actionBusy}
              {...{ "onCreate-slot": props.onCreateSlot }}
              onClose={props.onClear}
            />
          </div>
        );
      }

      if (props.selectedSlot) {
        return (
          <div class="mai-action-popover" style={activePopoverStyle.value}>
            <MaiSlotActionsCard
              slot={props.selectedSlot}
              busy={props.actionBusy}
              {...{
                "onBook-slot": props.onBookSlot,
                "onCancel-slot": props.onCancelSlot,
                "onDelete-slot": props.onDeleteSlot,
              }}
              onClose={props.onClear}
            />
          </div>
        );
      }

      if (props.selectedAppointment) {
        return (
          <div class="mai-action-popover" style={activePopoverStyle.value}>
            <MaiAppointmentActionsCard
              appointment={props.selectedAppointment}
              busy={props.actionBusy}
              {...{
                "onCancel-appointment": props.onCancelAppointment,
                "onDelete-appointment": props.onDeleteAppointment,
              }}
              onClose={props.onClear}
            />
          </div>
        );
      }

      return null;
    };
  },
});
