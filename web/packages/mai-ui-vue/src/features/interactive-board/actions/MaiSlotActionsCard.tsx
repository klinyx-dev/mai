import { defineComponent, h, type PropType } from "vue";
import type {
  MaiActionVisibility,
  SlotActionEventPayload,
  SlotClickEventPayload,
} from "../../../types";
import { INTERACTION_ACTIONS } from "../../../types/interactive";
import {
  type ActionButtonModel,
  MAI_ACTION_BUTTON_TONES,
  MaiActionButtons,
  MaiActionCard,
  MaiActionDetailList,
} from "../../../shared/ui/action-card/MaiActionCard";
import { actionDayLabel, actionTimeRangeLabel } from "./display";
import { buildSlotActionPayload } from "./payload";
import { visibleActionButtons } from "./visibility";

export const MaiSlotActionsCard = defineComponent({
  name: "MaiSlotActionsCard",
  props: {
    slot: {
      type: Object as PropType<SlotClickEventPayload>,
      required: true,
    },
    busy: {
      type: Boolean,
      required: false,
      default: false,
    },
    visibleActions: {
      type: Object as PropType<MaiActionVisibility | undefined>,
      required: false,
      default: undefined,
    },
  },
  emits: {
    [INTERACTION_ACTIONS.BOOK_SLOT]: (payload: SlotActionEventPayload) =>
      typeof payload.slotId === "string",
    [INTERACTION_ACTIONS.CANCEL_SLOT]: (payload: SlotActionEventPayload) =>
      typeof payload.slotId === "string",
    [INTERACTION_ACTIONS.DELETE_SLOT]: (payload: SlotActionEventPayload) =>
      typeof payload.slotId === "string",
    close: () => true,
  },
  setup(props, { emit }) {
    const slotPayload = () => buildSlotActionPayload(props.slot.slotId);
    const buttons: ActionButtonModel[] = [
      {
        key: INTERACTION_ACTIONS.BOOK_SLOT,
        label: "Book slot",
        tone: MAI_ACTION_BUTTON_TONES.PRIMARY,
        disabled: props.busy,
        onClick: () => emit(INTERACTION_ACTIONS.BOOK_SLOT, slotPayload()),
      },
      {
        key: INTERACTION_ACTIONS.CANCEL_SLOT,
        label: "Cancel slot",
        disabled: props.busy,
        onClick: () => emit(INTERACTION_ACTIONS.CANCEL_SLOT, slotPayload()),
      },
      {
        key: INTERACTION_ACTIONS.DELETE_SLOT,
        label: "Delete slot",
        tone: MAI_ACTION_BUTTON_TONES.DANGER,
        disabled: props.busy,
        onClick: () => emit(INTERACTION_ACTIONS.DELETE_SLOT, slotPayload()),
      },
    ];

    return () => (
      <MaiActionCard
        eyebrow="Available slot"
        title={actionTimeRangeLabel(props.slot.startMinute, props.slot.endMinute)}
        subtitle={`${actionDayLabel(props.slot.dayIndex)} availability`}
        closeAriaLabel="Close slot actions"
        onClose={() => emit("close")}
      >
        <MaiActionDetailList
          details={[
            { label: "Slot ID", value: props.slot.slotId },
            { label: "Day", value: actionDayLabel(props.slot.dayIndex) },
          ]}
        />
        <MaiActionButtons buttons={visibleActionButtons(buttons, props.visibleActions)} />
      </MaiActionCard>
    );
  },
});
