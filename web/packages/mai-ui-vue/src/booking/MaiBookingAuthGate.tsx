import { defineComponent, h, type PropType } from "vue";
import type { MaiBookingCopy } from "../types/booking";

export const MaiBookingAuthGate = defineComponent({
  name: "MaiBookingAuthGate",
  props: {
    hasInvitee: {
      type: Boolean,
      required: true,
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
    requestAuth: () => true,
  },
  setup(props, { emit }) {
    return () =>
      props.hasInvitee ? null : (
        <section class="mai-booking-card" aria-labelledby="mai-booking-auth-title">
          <div class="mai-booking-card__body">
            <p class="mai-booking-section__eyebrow">
              {props.copy.authEyebrow ?? "Account"}
            </p>
            <h3 class="mai-booking-card__title" id="mai-booking-auth-title">
              {props.copy.authTitle ?? "Sign in to confirm"}
            </h3>
            <p class="mai-booking-card__text">
              {props.copy.authDescription ??
                "You can choose a time first. An account is required before the booking is confirmed."}
            </p>
          </div>
          <div class="mai-booking-card__actions">
            <button
              type="button"
              class="mai-booking-button mai-booking-button--primary"
              disabled={props.isBusy}
              onClick={() => emit("requestAuth")}
            >
              {props.copy.authAction ?? "Sign in or sign up"}
            </button>
          </div>
        </section>
      );
  },
});
