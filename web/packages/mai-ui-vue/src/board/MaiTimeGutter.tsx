import { defineComponent, h, type PropType } from "vue";

export const MaiTimeGutter = defineComponent({
  name: "MaiTimeGutter",
  props: {
    hourTicks: { type: Array as PropType<number[]>, required: true },
    minuteLabel: { type: Function as PropType<(value: number) => string>, required: true },
  },
  setup(props) {
    return () => (
      <div class="mai-board__time-column">
        <div class="mai-board__time-column-header">Time</div>
        <div class="mai-board__time-grid">
          {props.hourTicks.map((tick) => (
            <div class="mai-board__time-label" key={`tick-${tick}`}>
              {props.minuteLabel(tick)}
            </div>
          ))}
        </div>
      </div>
    );
  },
});
