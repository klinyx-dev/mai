import { computed, defineComponent, h } from "vue";
import type { WeeklyLayout } from "@mai/mai-web-core";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function minuteLabel(totalMinutes: number): string {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

export const MaiBoard = defineComponent({
  name: "MaiBoard",
  props: {
    layout: {
      type: Object as () => WeeklyLayout | null,
      required: false,
      default: null,
    },
    title: {
      type: String,
      required: false,
      default: "Availability",
    },
    subtitle: {
      type: String,
      required: false,
      default: "Weekly clinical planning",
    },
  },
  setup(props) {
    const slotCount = computed(() => props.layout?.slots.length ?? 0);
    const appointmentCount = computed(() => props.layout?.appointments.length ?? 0);
    const dayColumns = computed(() => {
      if (!props.layout) {
        return DAY_LABELS.map((label, dayIndex) => ({
          dayIndex,
          label,
          slots: [] as WeeklyLayout["slots"],
          appointments: [] as WeeklyLayout["appointments"],
        }));
      }

      return DAY_LABELS.map((label, dayIndex) => ({
        dayIndex,
        label,
        slots: props.layout!.slots.filter((slot) => slot.day_index === dayIndex),
        appointments: props.layout!.appointments.filter(
          (appointment) => appointment.day_index === dayIndex
        ),
      }));
    });

    return () =>
      h("section", { class: "mai-board mai-board__panel" }, [
        h("header", { class: "mai-board__header" }, [
          h("div", { class: "mai-board__heading-block" }, [
            h("p", { class: "mai-board__kicker" }, "Doctor workspace"),
            h("h2", { class: "mai-board__title" }, props.title),
            h("p", { class: "mai-board__subtitle" }, props.subtitle),
          ]),
          h("div", { class: "mai-board__metrics" }, [
            h("span", { class: "mai-board__metric" }, `${slotCount.value} slots`),
            h(
              "span",
              { class: "mai-board__metric mai-board__metric--soft" },
              `${appointmentCount.value} appointments`
            ),
          ]),
        ]),
        h("div", { class: "mai-board__week" }, [
          ...dayColumns.value.map((column) =>
            h("article", { class: "mai-board__day", key: column.label }, [
              h("h3", { class: "mai-board__day-label" }, column.label),
              h("div", { class: "mai-board__stack" }, [
                ...column.slots.map((slot) =>
                  h("div", { class: "mai-board__item mai-board__item--slot", key: slot.slot_id }, [
                    h("p", { class: "mai-board__item-title" }, "Available slot"),
                    h(
                      "p",
                      { class: "mai-board__item-time" },
                      `${minuteLabel(slot.start_minute)}-${minuteLabel(slot.end_minute)}`
                    ),
                  ])
                ),
                ...column.appointments.map((appointment) =>
                  h(
                    "div",
                    {
                      class: "mai-board__item mai-board__item--appointment",
                      key: appointment.appointment_id,
                    },
                    [
                      h("p", { class: "mai-board__item-title" }, "Booked appointment"),
                      h(
                        "p",
                        { class: "mai-board__item-time" },
                        `${minuteLabel(appointment.start_minute)}-${minuteLabel(appointment.end_minute)}`
                      ),
                    ]
                  )
                ),
                column.slots.length === 0 && column.appointments.length === 0
                  ? h("p", { class: "mai-board__empty" }, "No events")
                  : null,
              ]),
            ])
          ),
        ]),
      ]);
  },
});
