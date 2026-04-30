import { computed, ref } from "vue";
import type {
  AppointmentActionEventPayload,
  AppointmentClickEventPayload,
  CreateSlotActionEventPayload,
  EmptyCellClickEventPayload,
  SlotActionEventPayload,
  SlotClickEventPayload,
  SlotRescheduleActionEventPayload,
} from "../../types";
import { MAI_BOARD_EVENTS, type MaiBoardEmit, type MaiBoardProps } from "../api";
import {
  DEFAULT_TOTAL_VISIBLE_MINUTES,
  addDaysIso,
  buildDayColumns,
  createHourTicks,
  formatMinuteLabel,
  mapCalendarEvents,
  normalizeVisibleWindow,
  startOfWeekIso,
  weekRangeLabel,
} from "../model/view-model";
import { buildNowIndicatorForWeek } from "../model/now-indicator";

export function useMaiBoardController(props: MaiBoardProps, emit: MaiBoardEmit) {
  const selectedSlot = ref<SlotClickEventPayload | null>(null);
  const selectedAppointment = ref<AppointmentClickEventPayload | null>(null);
  const pendingSlotDraft = ref<EmptyCellClickEventPayload | null>(null);
  const fallbackAnchorDate = new Date().toISOString().slice(0, 10);

  const slotCount = computed(() => props.layout?.slots.length ?? 0);
  const appointmentCount = computed(() => props.layout?.appointments.length ?? 0);
  const weekStartIso = computed(
    () => props.layout?.week_start ?? startOfWeekIso(props.anchorDate ?? fallbackAnchorDate)
  );
  const weekEndIso = computed(() => addDaysIso(weekStartIso.value, 6));
  const weekLabel = computed(() => weekRangeLabel(weekStartIso.value, weekEndIso.value));

  const visibleWindow = computed(() =>
    normalizeVisibleWindow(props.visibleStartMinute, props.visibleEndMinute)
  );
  const hourTicks = computed(() =>
    createHourTicks(visibleWindow.value.startMinute, visibleWindow.value.endMinute)
  );
  const totalVisibleMinutes = computed(
    () =>
      visibleWindow.value.endMinute - visibleWindow.value.startMinute ||
      DEFAULT_TOTAL_VISIBLE_MINUTES
  );
  const minuteTextFormatter = computed(
    () => (minute: number) => formatMinuteLabel(minute, props.timeLabelFormat)
  );

  const calendarEvents = computed(() => mapCalendarEvents(props.layout));
  const dayColumns = computed(() => buildDayColumns(weekStartIso.value, calendarEvents.value));
  const nowIndicator = computed(() =>
    buildNowIndicatorForWeek({
      weekStartIso: weekStartIso.value,
      visibleStartMinute: visibleWindow.value.startMinute,
      visibleEndMinute: visibleWindow.value.endMinute,
      now: new Date(),
    })
  );

  function clearActions() {
    selectedSlot.value = null;
    selectedAppointment.value = null;
    pendingSlotDraft.value = null;
  }

  function handleSlotClick(payload: SlotClickEventPayload) {
    selectedSlot.value = payload;
    selectedAppointment.value = null;
    pendingSlotDraft.value = null;
    emit(MAI_BOARD_EVENTS.SLOT_CLICK, payload);
  }

  function handleAppointmentClick(payload: AppointmentClickEventPayload) {
    selectedAppointment.value = payload;
    selectedSlot.value = null;
    pendingSlotDraft.value = null;
    emit(MAI_BOARD_EVENTS.APPOINTMENT_CLICK, payload);
  }

  function handleEmptyCellClick(payload: EmptyCellClickEventPayload) {
    pendingSlotDraft.value = payload;
    selectedSlot.value = null;
    selectedAppointment.value = null;
    emit(MAI_BOARD_EVENTS.EMPTY_CELL_CLICK, payload);
  }

  function emitCreateSlot(payload: CreateSlotActionEventPayload) {
    emit(MAI_BOARD_EVENTS.CREATE_SLOT, payload);
    clearActions();
  }

  function emitRescheduleSlot(payload: SlotRescheduleActionEventPayload) {
    emit(MAI_BOARD_EVENTS.RESCHEDULE_SLOT, payload);
    clearActions();
  }

  function emitBookSlot(payload: SlotActionEventPayload) {
    emit(MAI_BOARD_EVENTS.BOOK_SLOT, payload);
    clearActions();
  }

  function emitCancelSlot(payload: SlotActionEventPayload) {
    emit(MAI_BOARD_EVENTS.CANCEL_SLOT, payload);
    clearActions();
  }

  function emitDeleteSlot(payload: SlotActionEventPayload) {
    emit(MAI_BOARD_EVENTS.DELETE_SLOT, payload);
    clearActions();
  }

  function emitCancelAppointment(payload: AppointmentActionEventPayload) {
    emit(MAI_BOARD_EVENTS.CANCEL_APPOINTMENT, payload);
    clearActions();
  }

  function emitDeleteAppointment(payload: AppointmentActionEventPayload) {
    emit(MAI_BOARD_EVENTS.DELETE_APPOINTMENT, payload);
    clearActions();
  }

  return {
    selectedSlot,
    selectedAppointment,
    pendingSlotDraft,
    slotCount,
    appointmentCount,
    weekStartIso,
    weekLabel,
    visibleWindow,
    hourTicks,
    totalVisibleMinutes,
    minuteTextFormatter,
    dayColumns,
    nowIndicator,
    clearActions,
    handleSlotClick,
    handleAppointmentClick,
    handleEmptyCellClick,
    emitCreateSlot,
    emitRescheduleSlot,
    emitBookSlot,
    emitCancelSlot,
    emitDeleteSlot,
    emitCancelAppointment,
    emitDeleteAppointment,
  };
}
