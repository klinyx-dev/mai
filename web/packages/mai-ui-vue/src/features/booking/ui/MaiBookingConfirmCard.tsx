import { buildAppointmentTitle } from "@mai/mai-web-core";
import { computed, defineComponent, h, type PropType } from "vue";
import { formatMinuteLabel } from "../../board/internal/model/view-model.js";
import {
  MAI_TIME_LABEL_FORMATS,
  type TimeLabelFormat,
} from "../../../types/board.js";
import type {
  MaiBookingCopy,
  MaiBookingLocation,
  MaiBookingSlotSelection,
} from "../../../types/booking";
import { isAlwaysValid } from "../../../validators/events.js";

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
    location: {
      type: Object as PropType<MaiBookingLocation | null>,
      default: null,
    },
    resourceLabel: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
    timeLabelFormat: {
      type: String as PropType<TimeLabelFormat>,
      default: MAI_TIME_LABEL_FORMATS.TWENTY_FOUR_HOUR,
    },
    isBusy: {
      type: Boolean,
      default: false,
    },
    copy: {
      type: Object as PropType<MaiBookingCopy>,
      default: () => ({}),
    },
  },
  emits: {
    confirm: () => isAlwaysValid(),
    back: () => isAlwaysValid(),
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
          <p class="mai-booking-section__eyebrow">
            {props.copy.confirmEyebrow ?? "Confirm"}
          </p>
          <h3 class="mai-booking-card__title" id="mai-booking-confirm-title">
            {props.copy.confirmTitle ?? "Confirm booking"}
          </h3>
          <dl class="mai-booking-summary">
            <div class="mai-booking-summary__row">
              <dt>{props.copy.confirmTitleLabel ?? "Title"}</dt>
              <dd>{appointmentTitle.value}</dd>
            </div>
            <div class="mai-booking-summary__row">
              <dt>{props.copy.confirmTimeLabel ?? "Time"}</dt>
              <dd class="mai-booking-summary__time">{slotTimeLabel.value}</dd>
            </div>
            {props.location ? (
              <div class="mai-booking-summary__row">
                <dt>{props.copy.locationEyebrow ?? "Location"}</dt>
                <dd>{props.location.label}</dd>
              </div>
            ) : null}
            {props.resourceLabel ? (
              <div class="mai-booking-summary__row">
                <dt>{props.copy.confirmResourceLabel ?? "Resource"}</dt>
                <dd>{props.resourceLabel}</dd>
              </div>
            ) : null}
            {props.notes ? (
              <div class="mai-booking-summary__row">
                <dt>{props.copy.confirmNotesLabel ?? "Notes"}</dt>
                <dd>{props.notes}</dd>
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
            {props.copy.backAction ?? "Back"}
          </button>
          <button
            type="button"
            class="mai-booking-button mai-booking-button--primary"
            disabled={props.isBusy}
            onClick={() => emit("confirm")}
          >
            {props.copy.confirmAction ?? "Confirm booking"}
          </button>
        </div>
      </section>
    );
  },
});
