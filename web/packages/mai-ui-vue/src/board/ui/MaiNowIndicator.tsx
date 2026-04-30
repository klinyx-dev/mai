import { defineComponent, h } from "vue";

export const MaiNowIndicator = defineComponent({
  name: "MaiNowIndicator",
  props: {
    topPercent: { type: Number, required: true },
  },
  setup(props) {
    return () => (
      <div
        class="mai-board__now-indicator"
        style={{ top: `${props.topPercent}%` }}
        aria-hidden="true"
      >
        <span class="mai-board__now-indicator-dot"></span>
      </div>
    );
  },
});
