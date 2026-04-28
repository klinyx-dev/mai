import { defineComponent, h } from "vue";

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
  },
  emits: {
    requestAuth: () => true,
  },
  setup(props, { emit }) {
    return () =>
      props.hasInvitee ? null : (
        <section class="mai-booking-card" aria-labelledby="mai-booking-auth-title">
          <div class="mai-booking-card__body">
            <p class="mai-booking-section__eyebrow">Account</p>
            <h3 class="mai-booking-card__title" id="mai-booking-auth-title">
              Sign in to confirm
            </h3>
            <p class="mai-booking-card__text">
              You can choose a time first. An account is required before the
              appointment is booked.
            </p>
          </div>
          <div class="mai-booking-card__actions">
            <button
              type="button"
              class="mai-booking-button mai-booking-button--primary"
              disabled={props.isBusy}
              onClick={() => emit("requestAuth")}
            >
              Sign in or sign up
            </button>
          </div>
        </section>
      );
  },
});
