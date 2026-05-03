import { defineComponent, h, type PropType } from "vue";
import type {
  MaiActionVisibility,
  SlotActionEventPayload,
  SlotClickEventPayload,
} from "../types";
import { INTERACTION_ACTIONS } from "../types/interactive";
import {
  type ActionButtonModel,
  MaiActionButtons,
  MaiActionCard,
  MaiActionMetaList,
} from "./MaiActionCard";
import { buildSlotActionPayload } from "./payload";
import { isMaiActionVisible } from "./visibility";

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
    ];

    return () =>
      h(
        MaiActionCard,
        {
          title: "Selected Slot",
          closeAriaLabel: "Close slot actions",
          onClose: () => emit("close"),
        },
        {
          default: () => [
            h(MaiActionMetaList, {
              lines: [
                `${props.slot.slotId} - day ${props.slot.dayIndex}`,
                `${props.slot.startMinute} - ${props.slot.endMinute}`,
              ],
            }),
            h(MaiActionButtons, {
              buttons: buttons.filter((button) =>
                isMaiActionVisible(
                  props.visibleActions,
                  button.key as (typeof INTERACTION_ACTIONS)[keyof typeof INTERACTION_ACTIONS]
                )
              ),
            }),
          ],
        }
      );
  },
});
