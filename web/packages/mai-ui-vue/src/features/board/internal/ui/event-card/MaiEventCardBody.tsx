import { defineComponent, h, type PropType } from "vue";
import {
  MAI_EVENT_TIME_DENSITIES,
  eventTimeText,
} from "../../model/event-display";
import type { CalendarEvent } from "../../model/view-model";
import {
  type EventCardDensity,
  eventDescription,
  eventDurationLabel,
  eventTitle,
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
      default: MAI_EVENT_TIME_DENSITIES.COMFORTABLE,
    },
  },
  setup(props) {
    return () => {
      const title = eventTitle(props.eventKind);
      const description = eventDescription(props.eventKind);
      const duration = eventDurationLabel(props.startMinute, props.endMinute);
      const isInline = props.density !== MAI_EVENT_TIME_DENSITIES.COMFORTABLE;
      const time = eventTimeText(
        props.minuteLabel,
        props.startMinute,
        props.endMinute,
        props.density
      );
      const showInlineMain = props.density !== MAI_EVENT_TIME_DENSITIES.MICRO;
      const showInlineDescription =
        props.density === MAI_EVENT_TIME_DENSITIES.COMPACT;

      if (isInline) {
        return (
          <div
            class={[
              "mai-board__event-summary",
              "mai-board__event-summary--inline",
              showInlineMain ? "" : "mai-board__event-summary--time-only",
              `mai-board__event-summary--${props.density}`,
            ].filter(Boolean)}
          >
            {showInlineMain ? (
              <span class="mai-board__event-inline-main">
                <span class="mai-board__event-badge">{title}</span>
                {showInlineDescription ? (
                  <span class="mai-board__event-heading mai-board__event-heading--inline">
                    {description}
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
        );
      }

      return (
        <div
          class={[
            "mai-board__event-summary",
            `mai-board__event-summary--${props.density}`,
          ].filter(Boolean)}
        >
          <div class="mai-board__event-meta">
            <span class="mai-board__event-badge">{title}</span>
            <span class="mai-board__event-duration">{duration}</span>
          </div>
          <p class="mai-board__event-heading">{description}</p>
          <p class="mai-board__event-time-row">
            <span class="mai-board__event-time-dot" aria-hidden="true" />
            <span class="mai-board__event-time">{time}</span>
          </p>
        </div>
      );
    };
  },
});
