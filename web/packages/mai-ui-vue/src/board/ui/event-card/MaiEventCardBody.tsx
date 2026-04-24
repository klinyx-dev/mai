import { defineComponent, h, type PropType } from "vue";
import type { CalendarEvent } from "../../model/view-model";
import { eventTitle, timeText } from "./helpers";

export const MaiEventCardBody = defineComponent({
  name: "MaiEventCardBody",
  props: {
    eventKind: { type: String as () => CalendarEvent["kind"], required: true },
    startMinute: { type: Number, required: true },
    endMinute: { type: Number, required: true },
    minuteLabel: { type: Function as PropType<(value: number) => string>, required: true },
  },
  setup(props) {
    return () => (
      <p class="mai-board__event-summary">
        <span class="mai-board__event-title">{eventTitle(props.eventKind)}</span>
        <span class="mai-board__event-time">
          {timeText(props.minuteLabel, props.startMinute, props.endMinute)}
        </span>
      </p>
    );
  },
});
