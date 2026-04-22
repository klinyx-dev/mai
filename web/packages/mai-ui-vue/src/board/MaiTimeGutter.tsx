import { defineComponent, h, type PropType } from "vue";

export const MaiTimeGutter = defineComponent({
  name: "MaiTimeGutter",
  props: {
    hourTicks: { type: Array as PropType<number[]>, required: true },
    minuteLabel: { type: Function as PropType<(value: number) => string>, required: true },
  },
  setup(props) {
    const tickCount = Math.max(props.hourTicks.length - 1, 1);

    return () => (
      <div class="mai-board__time-column">
        <div class="mai-board__time-column-header">Time</div>
        <div class="mai-board__time-grid">
          {props.hourTicks.map((tick, index) => {
            if (index === 0 || index === tickCount) {
              return null;
            }
            const top = (index / tickCount) * 100;
            return (
              <div class="mai-board__time-label" key={`tick-${tick}`} style={{ top: `${top}%` }}>
                {props.minuteLabel(tick)}
              </div>
            );
          })}
        </div>
      </div>
    );
  },
});
