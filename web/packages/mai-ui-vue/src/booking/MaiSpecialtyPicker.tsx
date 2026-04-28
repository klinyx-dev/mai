import { defineComponent, h, type PropType } from "vue";
import type { MaiBookingSpecialty } from "../types/booking";

export const MaiSpecialtyPicker = defineComponent({
  name: "MaiSpecialtyPicker",
  props: {
    specialties: {
      type: Array as PropType<MaiBookingSpecialty[]>,
      required: true,
    },
    selectedSpecialtyId: {
      type: String,
      default: null,
    },
  },
  emits: {
    specialtySelected: (specialtyId: string) => specialtyId.length > 0,
  },
  setup(props, { emit }) {
    return () => (
      <section class="mai-booking-section" aria-labelledby="mai-booking-specialty-title">
        <div class="mai-booking-section__header">
          <p class="mai-booking-section__eyebrow">Reason</p>
          <h3 class="mai-booking-section__title" id="mai-booking-specialty-title">
            Choose a specialty
          </h3>
        </div>
        <div class="mai-booking-option-grid">
          {props.specialties.map((specialty) => {
            const isSelected = specialty.specialtyId === props.selectedSpecialtyId;
            return (
              <button
                type="button"
                class={[
                  "mai-booking-option",
                  isSelected ? "mai-booking-option--selected" : "",
                ]}
                aria-pressed={isSelected}
                onClick={() => emit("specialtySelected", specialty.specialtyId)}
                key={specialty.specialtyId}
              >
                <span class="mai-booking-option__label">{specialty.label}</span>
                {specialty.reasonLabel ? (
                  <span class="mai-booking-option__meta">{specialty.reasonLabel}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>
    );
  },
});
