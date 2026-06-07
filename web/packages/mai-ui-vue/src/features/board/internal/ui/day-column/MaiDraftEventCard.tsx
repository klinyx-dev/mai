import { defineComponent, h, type PropType } from "vue";
import {
  MAI_EVENT_TIME_DENSITIES,
  eventTimeText,
} from "../../model/event-display";
import {
  eventCardDensity,
  eventDurationLabel,
} from "../event-card/helpers";

export const MaiDraftEventCard = defineComponent({
  name: "MaiDraftEventCard",
  props: {
    top: { type: Number, required: true },
    height: { type: Number, required: true },
    startMinute: { type: Number, required: true },
    endMinute: { type: Number, required: true },
    minuteLabel: { type: Function as PropType<(value: number) => string>, required: true },
    dragging: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props) {
    return () => {
      const density = eventCardDensity(props.startMinute, props.endMinute);
      const duration = eventDurationLabel(props.startMinute, props.endMinute);
      const time = eventTimeText(
        props.minuteLabel,
        props.startMinute,
        props.endMinute,
        density
      );
      const isInline = density !== MAI_EVENT_TIME_DENSITIES.COMFORTABLE;
      const showInlineMain = density !== MAI_EVENT_TIME_DENSITIES.MICRO;
      const showInlineDescription = density === MAI_EVENT_TIME_DENSITIES.COMPACT;

      return (
        <div
          class={[
            "mai-board__event",
            "mai-board__event--draft",
            props.dragging ? "mai-board__event--draft-active" : "",
            `mai-board__event--${density}`,
          ]
            .filter(Boolean)
            .join(" ")}
          style={{ top: `${props.top}%`, height: `${props.height}%` }}
        >
          {isInline ? (
            <div
              class={[
                "mai-board__event-summary",
                "mai-board__event-summary--inline",
                showInlineMain ? "" : "mai-board__event-summary--time-only",
                `mai-board__event-summary--${density}`,
              ].filter(Boolean)}
            >
              {showInlineMain ? (
                <span class="mai-board__event-inline-main">
                  <span class="mai-board__event-badge">Draft</span>
                  {showInlineDescription ? (
                    <span class="mai-board__event-heading mai-board__event-heading--inline">
                      Open slot
                    </span>
                  ) : null}
                </span>
              ) : null}
              <p class="mai-board__event-time-row mai-board__event-time-row--inline">
                <span class="mai-board__event-time">{time}</span>
                <span class="mai-board__event-duration mai-board__event-duration--inline">
                  {duration}
                </span>
              </p>
            </div>
          ) : (
            <div
              class={[
                "mai-board__event-summary",
                `mai-board__event-summary--${density}`,
              ].filter(Boolean)}
            >
              <div class="mai-board__event-meta">
                <span class="mai-board__event-badge">Draft</span>
                <span class="mai-board__event-duration">{duration}</span>
              </div>
              <p class="mai-board__event-heading">Open slot</p>
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
