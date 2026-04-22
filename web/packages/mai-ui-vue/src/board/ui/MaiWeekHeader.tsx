import { defineComponent, h } from "vue";
import type { WeekShift } from "../../types";

export const MaiWeekHeader = defineComponent({
  name: "MaiWeekHeader",
  props: {
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    weekLabel: { type: String, required: true },
    slotCount: { type: Number, required: true },
    appointmentCount: { type: Number, required: true },
    isLoading: { type: Boolean, required: true },
  },
  emits: {
    navigateWeek: (shift: WeekShift) => shift === -1 || shift === 0 || shift === 1,
  },
  setup(props, { emit }) {
    return () => (
      <header class="mai-board__header">
        <div class="mai-board__heading-block">
          <p class="mai-board__kicker">Doctor workspace</p>
          <h2 class="mai-board__title">{props.title}</h2>
          <p class="mai-board__subtitle">{props.subtitle}</p>
        </div>
        <div class="mai-board__toolbar">
          <div class="mai-board__navigation">
            <button type="button" class="mai-board__nav-button" onClick={() => emit("navigateWeek", -1)}>
              Prev
            </button>
            <button
              type="button"
              class="mai-board__nav-button mai-board__nav-button--today"
              onClick={() => emit("navigateWeek", 0)}
            >
              Today
            </button>
            <button type="button" class="mai-board__nav-button" onClick={() => emit("navigateWeek", 1)}>
              Next
            </button>
          </div>
          <p class="mai-board__range-label">{props.weekLabel}</p>
          <div class="mai-board__metrics">
            <span class="mai-board__metric">{props.slotCount} slots</span>
            <span class="mai-board__metric mai-board__metric--soft">
              {props.appointmentCount} appointments
            </span>
            {props.isLoading ? <span class="mai-board__metric mai-board__metric--soft">Loading…</span> : null}
          </div>
        </div>
      </header>
    );
  },
});
