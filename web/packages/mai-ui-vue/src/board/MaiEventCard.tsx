import { defineComponent, h, type PropType } from "vue";
import type { CalendarEvent } from "./view-model";

export const MaiEventCard = defineComponent({
  name: "MaiEventCard",
  props: {
    event: { type: Object as PropType<CalendarEvent>, required: true },
    top: { type: Number, required: true },
    height: { type: Number, required: true },
    minuteLabel: { type: Function as PropType<(value: number) => string>, required: true },
    onActivate: {
      type: Function as PropType<(event: CalendarEvent) => void>,
      required: true,
    },
  },
  setup(props) {
    function handleActivate() {
      props.onActivate(props.event);
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleActivate();
      }
    }

    return () => (
      <div
        class={`mai-board__event mai-board__event--${props.event.kind}`}
        key={`${props.event.kind}-${props.event.id}`}
        style={{ top: `${props.top}%`, height: `${props.height}%` }}
        role="button"
        tabindex={0}
        onClick={(event) => {
          event.stopPropagation();
          handleActivate();
        }}
        onKeydown={handleKeydown}
      >
        <p class="mai-board__event-title">
          {props.event.kind === "slot" ? "Available slot" : "Appointment"}
        </p>
        <p class="mai-board__event-time">
          {props.minuteLabel(props.event.startMinute)}-{props.minuteLabel(props.event.endMinute)}
        </p>
      </div>
    );
  },
});
