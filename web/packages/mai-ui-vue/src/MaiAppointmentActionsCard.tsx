import { defineComponent, h, type PropType } from "vue";
import type {
  AppointmentActionEventPayload,
  AppointmentClickEventPayload,
} from "./contracts";

export const MaiAppointmentActionsCard = defineComponent({
  name: "MaiAppointmentActionsCard",
  props: {
    appointment: {
      type: Object as PropType<AppointmentClickEventPayload>,
      required: true,
    },
    busy: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  emits: {
    "delete-appointment": (payload: AppointmentActionEventPayload) =>
      typeof payload.appointmentId === "string",
    close: () => true,
  },
  setup(props, { emit }) {
    return () => (
      <section class="mai-action-card">
        <header class="mai-action-card__header">
          <h3 class="mai-action-card__title">Selected Appointment</h3>
          <button
            type="button"
            class="mai-action-card__close"
            onClick={() => emit("close")}
            aria-label="Close appointment actions"
          >
            ×
          </button>
        </header>
        <p class="mai-action-card__meta">
          {props.appointment.appointmentId} · slot {props.appointment.slotId}
        </p>
        <p class="mai-action-card__meta">
          day {props.appointment.dayIndex} · {props.appointment.startMinute} -{" "}
          {props.appointment.endMinute}
        </p>
        <div class="mai-action-card__actions">
          <button
            type="button"
            class="mai-action-button mai-action-button--danger"
            disabled={props.busy}
            onClick={() =>
              emit("delete-appointment", {
                appointmentId: props.appointment.appointmentId,
              })
            }
          >
            Delete Appointment
          </button>
        </div>
      </section>
    );
  },
});
