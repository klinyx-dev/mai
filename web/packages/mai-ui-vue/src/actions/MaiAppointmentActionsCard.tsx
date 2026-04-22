import { defineComponent, h, type PropType } from "vue";
import type {
  AppointmentActionEventPayload,
  AppointmentClickEventPayload,
} from "../contracts";
import {
  MaiActionButtons,
  MaiActionCard,
  MaiActionMetaList,
} from "./MaiActionCard";
import { buildAppointmentActionPayload } from "./payload";

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
    "cancel-appointment": (payload: AppointmentActionEventPayload) =>
      typeof payload.appointmentId === "string",
    close: () => true,
  },
  setup(props, { emit }) {
    const appointmentPayload = () =>
      buildAppointmentActionPayload(props.appointment.appointmentId);

    return () => (
      <MaiActionCard
        title="Selected Appointment"
        closeAriaLabel="Close appointment actions"
        onClose={() => emit("close")}
      >
        <MaiActionMetaList
          lines={[
            `${props.appointment.appointmentId} - slot ${props.appointment.slotId}`,
            `day ${props.appointment.dayIndex} - ${props.appointment.startMinute} - ${props.appointment.endMinute}`,
          ]}
        />
        <MaiActionButtons
          buttons={[
            {
              key: "delete-appointment",
              label: "Delete Appointment",
              tone: "danger",
              disabled: props.busy,
              onClick: () => emit("delete-appointment", appointmentPayload()),
            },
            {
              key: "cancel-appointment",
              label: "Cancel Appointment",
              disabled: props.busy,
              onClick: () => emit("cancel-appointment", appointmentPayload()),
            },
          ]}
        />
      </MaiActionCard>
    );
  },
});
