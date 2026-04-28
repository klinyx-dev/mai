import { computed, defineComponent, h, type PropType } from "vue";
import type { MaiBookingDoctor } from "../types/booking";
import { eligibleDoctorsForSpecialty } from "./options.js";

export const MaiDoctorPicker = defineComponent({
  name: "MaiDoctorPicker",
  props: {
    doctors: {
      type: Array as PropType<MaiBookingDoctor[]>,
      required: true,
    },
    selectedSpecialtyId: {
      type: String,
      default: null,
    },
    selectedDoctorId: {
      type: String,
      default: null,
    },
  },
  emits: {
    doctorSelected: (doctorId: string | null) =>
      doctorId === null || doctorId.length > 0,
  },
  setup(props, { emit }) {
    const eligibleDoctors = computed(() =>
      eligibleDoctorsForSpecialty(props.doctors, props.selectedSpecialtyId)
    );

    return () => (
      <section class="mai-booking-section" aria-labelledby="mai-booking-doctor-title">
        <div class="mai-booking-section__header">
          <p class="mai-booking-section__eyebrow">Doctor</p>
          <h3 class="mai-booking-section__title" id="mai-booking-doctor-title">
            Choose a doctor
          </h3>
          <p class="mai-booking-section__description">
            Optional. Leave unset to see all eligible doctors.
          </p>
        </div>
        <div class="mai-booking-option-grid mai-booking-option-grid--compact">
          <button
            type="button"
            class={[
              "mai-booking-option",
              "mai-booking-option--compact",
              props.selectedDoctorId === null ? "mai-booking-option--selected" : "",
            ]}
            aria-pressed={props.selectedDoctorId === null}
            onClick={() => emit("doctorSelected", null)}
          >
            <span class="mai-booking-option__label">Any eligible doctor</span>
            <span class="mai-booking-option__meta">Default</span>
          </button>
          {eligibleDoctors.value.map((doctor) => {
            const isSelected = doctor.doctorId === props.selectedDoctorId;
            return (
              <button
                type="button"
                class={[
                  "mai-booking-option",
                  "mai-booking-option--compact",
                  isSelected ? "mai-booking-option--selected" : "",
                ]}
                aria-pressed={isSelected}
                onClick={() => emit("doctorSelected", doctor.doctorId)}
                key={doctor.doctorId}
              >
                <span class="mai-booking-option__identity">
                  <span class="mai-booking-avatar" aria-hidden="true">
                    {doctor.displayName.slice(0, 1).toUpperCase()}
                  </span>
                  <span class="mai-booking-option__label">{doctor.displayName}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>
    );
  },
});
