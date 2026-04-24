import { defineComponent, h, type PropType } from "vue";

export const MaiDraftEventCard = defineComponent({
  name: "MaiDraftEventCard",
  props: {
    top: { type: Number, required: true },
    height: { type: Number, required: true },
    startMinute: { type: Number, required: true },
    endMinute: { type: Number, required: true },
    minuteLabel: { type: Function as PropType<(value: number) => string>, required: true },
  },
  setup(props) {
    return () => (
      <div
        class="mai-board__event mai-board__event--draft"
        style={{ top: `${props.top}%`, height: `${props.height}%` }}
      >
        <p class="mai-board__event-title">New slot</p>
        <p class="mai-board__event-time">
          {props.minuteLabel(props.startMinute)}-{props.minuteLabel(props.endMinute)}
        </p>
      </div>
    );
  },
});
