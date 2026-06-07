import { defineComponent, h, type PropType } from "vue";
import type {
  AppointmentActionEventPayload,
  AppointmentClickEventPayload,
  MaiActionVisibility,
} from "../../../types";
import { INTERACTION_ACTIONS } from "../../../types/interactive";
import {
  type ActionButtonModel,
  MAI_ACTION_BUTTON_TONES,
  MaiActionButtons,
  MaiActionCard,
  MaiActionDetailList,
} from "../../../shared/ui/action-card/MaiActionCard";
import { actionDayLabel, actionTimeRangeLabel } from "./display";
import { buildAppointmentActionPayload } from "./payload";
import { visibleActionButtons } from "./visibility";

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
    visibleActions: {
      type: Object as PropType<MaiActionVisibility | undefined>,
      required: false,
      default: undefined,
    },
  },
  emits: {
    [INTERACTION_ACTIONS.DELETE_APPOINTMENT]: (
      payload: AppointmentActionEventPayload
    ) =>
      typeof payload.appointmentId === "string",
    [INTERACTION_ACTIONS.CANCEL_APPOINTMENT]: (
      payload: AppointmentActionEventPayload
    ) =>
      typeof payload.appointmentId === "string",
    close: () => true,
  },
  setup(props, { emit }) {
    const appointmentPayload = () =>
      buildAppointmentActionPayload(props.appointment.appointmentId);
    const buttons: ActionButtonModel[] = [
      {
        key: INTERACTION_ACTIONS.CANCEL_APPOINTMENT,
        label: "Cancel appointment",
        disabled: props.busy,
        onClick: () =>
          emit(INTERACTION_ACTIONS.CANCEL_APPOINTMENT, appointmentPayload()),
      },
      {
        key: INTERACTION_ACTIONS.DELETE_APPOINTMENT,
        label: "Delete appointment",
        tone: MAI_ACTION_BUTTON_TONES.DANGER,
        disabled: props.busy,
        onClick: () =>
          emit(INTERACTION_ACTIONS.DELETE_APPOINTMENT, appointmentPayload()),
      },
    ];

    return () => (
      <MaiActionCard
        eyebrow="Appointment"
        title={actionTimeRangeLabel(
          props.appointment.startMinute,
          props.appointment.endMinute
        )}
        subtitle={`${actionDayLabel(props.appointment.dayIndex)} booking`}
        closeAriaLabel="Close appointment actions"
        onClose={() => emit("close")}
      >
        <MaiActionDetailList
          details={[
            { label: "Appointment ID", value: props.appointment.appointmentId },
            { label: "Slot ID", value: props.appointment.slotId },
          ]}
        />
        <MaiActionButtons
          buttons={visibleActionButtons(buttons, props.visibleActions)}
        />
      </MaiActionCard>
    );
  },
});
