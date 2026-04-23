import { defineComponent, h, type PropType } from "vue";
import type { SlotActionEventPayload, SlotClickEventPayload } from "../types";
import { INTERACTION_ACTIONS } from "../types/interactive";
import {
  MaiActionButtons,
  MaiActionCard,
  MaiActionMetaList,
} from "./MaiActionCard";
import { buildSlotActionPayload } from "./payload";

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

    return () => (
      <MaiActionCard
        title="Selected Slot"
        closeAriaLabel="Close slot actions"
        onClose={() => emit("close")}
      >
        <MaiActionMetaList
          lines={[
            `${props.slot.slotId} - day ${props.slot.dayIndex}`,
            `${props.slot.startMinute} - ${props.slot.endMinute}`,
          ]}
        />
        <MaiActionButtons
          buttons={[
            {
              key: INTERACTION_ACTIONS.BOOK_SLOT,
              label: "Book Slot",
              tone: "primary",
              disabled: props.busy,
              onClick: () => emit(INTERACTION_ACTIONS.BOOK_SLOT, slotPayload()),
            },
            {
              key: INTERACTION_ACTIONS.CANCEL_SLOT,
              label: "Cancel Slot",
              disabled: props.busy,
              onClick: () => emit(INTERACTION_ACTIONS.CANCEL_SLOT, slotPayload()),
            },
            {
              key: INTERACTION_ACTIONS.DELETE_SLOT,
              label: "Delete Slot",
              tone: "danger",
              disabled: props.busy,
              onClick: () => emit(INTERACTION_ACTIONS.DELETE_SLOT, slotPayload()),
            },
          ]}
        />
      </MaiActionCard>
    );
  },
});
