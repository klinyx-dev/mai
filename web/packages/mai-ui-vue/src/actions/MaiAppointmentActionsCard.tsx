import { defineComponent, h, type PropType } from "vue";
import type {
  AppointmentActionEventPayload,
  AppointmentClickEventPayload,
  MaiActionVisibility,
} from "../types";
import { INTERACTION_ACTIONS } from "../types/interactive";
import {
  type ActionButtonModel,
  MaiActionButtons,
  MaiActionCard,
  MaiActionMetaList,
} from "./MaiActionCard";
import { buildAppointmentActionPayload } from "./payload";
import { isMaiActionVisible } from "./visibility";

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
        key: INTERACTION_ACTIONS.DELETE_APPOINTMENT,
        label: "Delete Appointment",
        tone: "danger",
        disabled: props.busy,
        onClick: () =>
          emit(INTERACTION_ACTIONS.DELETE_APPOINTMENT, appointmentPayload()),
      },
      {
        key: INTERACTION_ACTIONS.CANCEL_APPOINTMENT,
        label: "Cancel Appointment",
        disabled: props.busy,
        onClick: () =>
          emit(INTERACTION_ACTIONS.CANCEL_APPOINTMENT, appointmentPayload()),
      },
    ];

    return () =>
      h(
        MaiActionCard,
        {
          title: "Selected Appointment",
          closeAriaLabel: "Close appointment actions",
          onClose: () => emit("close"),
        },
        {
          default: () => [
            h(MaiActionMetaList, {
              lines: [
                `${props.appointment.appointmentId} - slot ${props.appointment.slotId}`,
                `day ${props.appointment.dayIndex} - ${props.appointment.startMinute} - ${props.appointment.endMinute}`,
              ],
            }),
            h(MaiActionButtons, {
              buttons: buttons.filter((button) =>
                isMaiActionVisible(
                  props.visibleActions,
                  button.key as (typeof INTERACTION_ACTIONS)[keyof typeof INTERACTION_ACTIONS]
                )
              ),
            }),
          ],
        }
      );
  },
});
