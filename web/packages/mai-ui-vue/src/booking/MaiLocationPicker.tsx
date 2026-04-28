import { defineComponent, h, type PropType } from "vue";
import type { MaiBookingCopy, MaiBookingLocation } from "../types/booking";

export const MaiLocationPicker = defineComponent({
  name: "MaiLocationPicker",
  props: {
    locations: {
      type: Array as PropType<MaiBookingLocation[]>,
      required: true,
    },
    selectedLocationId: {
      type: String,
      default: null,
    },
    copy: {
      type: Object as PropType<MaiBookingCopy>,
      default: () => ({}),
    },
  },
  emits: {
    locationSelected: (locationId: string) => locationId.length > 0,
  },
  setup(props, { emit }) {
    return () => (
      <section class="mai-booking-section" aria-labelledby="mai-booking-location-title">
        <div class="mai-booking-section__header">
          <p class="mai-booking-section__eyebrow">
            {props.copy.locationEyebrow ?? "Location"}
          </p>
          <h3 class="mai-booking-section__title" id="mai-booking-location-title">
            {props.copy.locationTitle ?? "Choose a location"}
          </h3>
        </div>
        <div class="mai-booking-option-grid">
          {props.locations.map((location) => {
            const isSelected = location.locationId === props.selectedLocationId;
            return (
              <button
                type="button"
                class={[
                  "mai-booking-option",
                  isSelected ? "mai-booking-option--selected" : "",
                ]}
                aria-pressed={isSelected}
                onClick={() => emit("locationSelected", location.locationId)}
                key={location.locationId}
              >
                <span class="mai-booking-option__label">{location.label}</span>
                {location.description ? (
                  <span class="mai-booking-option__meta">{location.description}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>
    );
  },
});
