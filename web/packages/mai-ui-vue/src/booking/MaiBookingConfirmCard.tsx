import { buildAppointmentTitle } from "@mai/mai-web-core";
import { computed, defineComponent, h, type PropType } from "vue";
import { formatMinuteLabel } from "../board/model/view-model.js";
import type { TimeLabelFormat } from "../types";
import type { MaiBookingSlotSelection } from "../types/booking";

export const MaiBookingConfirmCard = defineComponent({
  name: "MaiBookingConfirmCard",
  props: {
    reason: {
      type: String,
      required: true,
    },
    userDisplayName: {
      type: String,
      required: true,
    },
    slot: {
      type: Object as PropType<MaiBookingSlotSelection>,
      required: true,
    },
    doctorDisplayName: {
      type: String,
      default: "",
    },
    timeLabelFormat: {
      type: String as PropType<TimeLabelFormat>,
      default: "24h",
    },
    isBusy: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    confirm: () => true,
    back: () => true,
  },
  setup(props, { emit }) {
    const appointmentTitle = computed(() =>
      buildAppointmentTitle({
        userDisplayName: props.userDisplayName,
        reason: props.reason,
      })
    );
    const slotTimeLabel = computed(
      () =>
        `${formatMinuteLabel(
          props.slot.startMinute,
          props.timeLabelFormat
        )} - ${formatMinuteLabel(props.slot.endMinute, props.timeLabelFormat)}`
    );

    return () => (
      <section class="mai-booking-card" aria-labelledby="mai-booking-confirm-title">
        <div class="mai-booking-card__body">
          <p class="mai-booking-section__eyebrow">Confirm</p>
          <h3 class="mai-booking-card__title" id="mai-booking-confirm-title">
            Confirm appointment
          </h3>
          <dl class="mai-booking-summary">
            <div class="mai-booking-summary__row">
              <dt>Title</dt>
              <dd>{appointmentTitle.value}</dd>
            </div>
            <div class="mai-booking-summary__row">
              <dt>Time</dt>
              <dd class="mai-booking-summary__time">{slotTimeLabel.value}</dd>
            </div>
            {props.doctorDisplayName ? (
              <div class="mai-booking-summary__row">
                <dt>Doctor</dt>
                <dd>{props.doctorDisplayName}</dd>
              </div>
            ) : null}
          </dl>
        </div>
        <div class="mai-booking-card__actions">
          <button
            type="button"
            class="mai-booking-button"
            disabled={props.isBusy}
            onClick={() => emit("back")}
          >
            Back
          </button>
          <button
            type="button"
            class="mai-booking-button mai-booking-button--primary"
            disabled={props.isBusy}
            onClick={() => emit("confirm")}
          >
            Confirm booking
          </button>
        </div>
      </section>
    );
  },
});
