import { defineComponent, h, type PropType } from "vue";
import type { SlotActionEventPayload, SlotClickEventPayload } from "../contracts";
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
    "book-slot": (payload: SlotActionEventPayload) => typeof payload.slotId === "string",
    "cancel-slot": (payload: SlotActionEventPayload) => typeof payload.slotId === "string",
    "delete-slot": (payload: SlotActionEventPayload) => typeof payload.slotId === "string",
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
              key: "book-slot",
              label: "Book Slot",
              tone: "primary",
              disabled: props.busy,
              onClick: () => emit("book-slot", slotPayload()),
            },
            {
              key: "cancel-slot",
              label: "Cancel Slot",
              disabled: props.busy,
              onClick: () => emit("cancel-slot", slotPayload()),
            },
            {
              key: "delete-slot",
              label: "Delete Slot",
              tone: "danger",
              disabled: props.busy,
              onClick: () => emit("delete-slot", slotPayload()),
            },
          ]}
        />
      </MaiActionCard>
    );
  },
});
