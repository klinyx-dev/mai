import { defineComponent, h, type PropType } from "vue";
import type { SlotClickEventPayload, SlotActionEventPayload } from "./contracts";

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
    const payload = () => ({ slotId: props.slot.slotId });

    return () => (
      <section class="mai-action-card">
        <header class="mai-action-card__header">
          <h3 class="mai-action-card__title">Selected Slot</h3>
          <button
            type="button"
            class="mai-action-card__close"
            onClick={() => emit("close")}
            aria-label="Close slot actions"
          >
            ×
          </button>
        </header>
        <p class="mai-action-card__meta">
          {props.slot.slotId} · day {props.slot.dayIndex}
        </p>
        <p class="mai-action-card__meta">
          {props.slot.startMinute} - {props.slot.endMinute}
        </p>
        <div class="mai-action-card__actions">
          <button
            type="button"
            class="mai-action-button mai-action-button--primary"
            disabled={props.busy}
            onClick={() => emit("book-slot", payload())}
          >
            Book Slot
          </button>
          <button
            type="button"
            class="mai-action-button"
            disabled={props.busy}
            onClick={() => emit("cancel-slot", payload())}
          >
            Cancel Slot
          </button>
          <button
            type="button"
            class="mai-action-button mai-action-button--danger"
            disabled={props.busy}
            onClick={() => emit("delete-slot", payload())}
          >
            Delete Slot
          </button>
        </div>
      </section>
    );
  },
});
