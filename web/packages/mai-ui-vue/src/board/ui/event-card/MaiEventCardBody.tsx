import { defineComponent, h, type PropType } from "vue";
import type { CalendarEvent } from "../../model/view-model";
import {
  type EventCardDensity,
  eventDescription,
  eventDurationLabel,
  eventTitle,
  timeText,
} from "./helpers";

export const MaiEventCardBody = defineComponent({
  name: "MaiEventCardBody",
  props: {
    eventKind: { type: String as () => CalendarEvent["kind"], required: true },
    startMinute: { type: Number, required: true },
    endMinute: { type: Number, required: true },
    minuteLabel: { type: Function as PropType<(value: number) => string>, required: true },
    density: {
      type: String as PropType<EventCardDensity>,
      required: false,
      default: "comfortable",
    },
  },
  setup(props) {
    return () => {
      const title = eventTitle(props.eventKind);
      const description = eventDescription(props.eventKind);
      const duration = eventDurationLabel(props.startMinute, props.endMinute);
      const time = timeText(props.minuteLabel, props.startMinute, props.endMinute);
      const isInline = props.density === "micro" || props.density === "tight";

      if (isInline) {
        return (
          <div
            class={[
              "mai-board__event-summary",
              "mai-board__event-summary--inline",
              `mai-board__event-summary--${props.density}`,
            ]}
          >
            <span class="mai-board__event-inline-main">
              <span class="mai-board__event-badge">{title}</span>
              <span class="mai-board__event-heading mai-board__event-heading--inline">
                {description}
              </span>
            </span>
            <p class="mai-board__event-time-row mai-board__event-time-row--inline">
              <span class="mai-board__event-time">{time}</span>
              {props.density === "tight" ? (
                <span class="mai-board__event-duration mai-board__event-duration--inline">
                  {duration}
                </span>
              ) : null}
            </p>
          </div>
        );
      }

      return (
        <div
          class={[
            "mai-board__event-summary",
            props.density === "compact" ? "mai-board__event-summary--compact" : "",
            `mai-board__event-summary--${props.density}`,
          ]}
        >
          <div class="mai-board__event-meta">
            <span class="mai-board__event-badge">{title}</span>
            {props.density === "compact" ? (
              <p class="mai-board__event-heading mai-board__event-heading--compact">
                {description}
              </p>
            ) : null}
            <span class="mai-board__event-duration">{duration}</span>
          </div>
          {props.density !== "compact" ? (
            <p class="mai-board__event-heading">{description}</p>
          ) : null}
          <p class="mai-board__event-time-row">
            <span class="mai-board__event-time-dot" aria-hidden="true" />
            <span class="mai-board__event-time">{time}</span>
          </p>
        </div>
      );
    };
  },
});
