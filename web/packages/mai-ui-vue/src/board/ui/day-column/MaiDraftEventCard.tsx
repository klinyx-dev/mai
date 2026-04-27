import { defineComponent, h, type PropType } from "vue";
import {
  eventCardDensity,
  eventDurationLabel,
  timeText,
} from "../event-card/helpers";

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
    return () => {
      const density = eventCardDensity(props.startMinute, props.endMinute);
      const duration = eventDurationLabel(props.startMinute, props.endMinute);
      const time = timeText(props.minuteLabel, props.startMinute, props.endMinute);
      const isInline = density === "micro" || density === "tight";

      return (
        <div
          class={["mai-board__event", "mai-board__event--draft", `mai-board__event--${density}`].join(
            " "
          )}
          style={{ top: `${props.top}%`, height: `${props.height}%` }}
        >
          {isInline ? (
            <div
              class={[
                "mai-board__event-summary",
                "mai-board__event-summary--inline",
                `mai-board__event-summary--${density}`,
              ]}
            >
              <span class="mai-board__event-badge">Draft</span>
              <p class="mai-board__event-heading mai-board__event-heading--inline">
                Open slot
              </p>
              <p class="mai-board__event-time-row mai-board__event-time-row--inline">
                <span class="mai-board__event-time">{time}</span>
                {density === "tight" ? (
                  <span class="mai-board__event-duration mai-board__event-duration--inline">
                    {duration}
                  </span>
                ) : null}
              </p>
            </div>
          ) : (
            <div
              class={[
                "mai-board__event-summary",
                density === "compact" ? "mai-board__event-summary--compact" : "",
                `mai-board__event-summary--${density}`,
              ]}
            >
              <div class="mai-board__event-meta">
                <span class="mai-board__event-badge">Draft</span>
                {density === "compact" ? (
                  <p class="mai-board__event-heading mai-board__event-heading--compact">
                    Open slot
                  </p>
                ) : null}
                <span class="mai-board__event-duration">{duration}</span>
              </div>
              {density !== "compact" ? (
                <p class="mai-board__event-heading">Open slot</p>
              ) : null}
              <p class="mai-board__event-time-row">
                <span class="mai-board__event-time-dot" aria-hidden="true" />
                <span class="mai-board__event-time">{time}</span>
              </p>
            </div>
          )}
        </div>
      );
    };
  },
});
