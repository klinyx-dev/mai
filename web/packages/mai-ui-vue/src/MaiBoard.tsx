import { computed, defineComponent, h, ref, type PropType } from "vue";
import type { WeeklyLayout } from "@mai/mai-web-core";
import type {
  AppointmentActionEventPayload,
  AppointmentClickEventPayload,
  CreateSlotActionEventPayload,
  EmptyCellClickEventPayload,
  SlotActionEventPayload,
  SlotClickEventPayload,
  TimeLabelFormat,
  WeekShift,
} from "./contracts";
import { MaiAppointmentActionsCard } from "./actions/MaiAppointmentActionsCard";
import { MaiCreateSlotCard } from "./actions/MaiCreateSlotCard";
import { MaiSlotActionsCard } from "./actions/MaiSlotActionsCard";
import { MaiDayColumn } from "./board/MaiDayColumn";
import { MaiTimeGutter } from "./board/MaiTimeGutter";
import { MaiWeekHeader } from "./board/MaiWeekHeader";
import {
  addDaysIso,
  buildDayColumns,
  createHourTicks,
  DEFAULT_TOTAL_VISIBLE_MINUTES,
  DEFAULT_VISIBLE_END_MINUTE,
  DEFAULT_VISIBLE_START_MINUTE,
  formatMinuteLabel,
  mapCalendarEvents,
  normalizeVisibleWindow,
  startOfWeekIso,
  weekRangeLabel,
} from "./board/view-model";

function isMinuteRange(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 1440
  );
}

function isSlotClickPayload(value: unknown): value is SlotClickEventPayload {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Record<string, unknown>;
  return (
    typeof payload.slotId === "string" &&
    Number.isInteger(payload.dayIndex) &&
    typeof payload.startMinute === "number" &&
    typeof payload.endMinute === "number" &&
    typeof payload.clientX === "number" &&
    typeof payload.clientY === "number"
  );
}

function isAppointmentClickPayload(value: unknown): value is AppointmentClickEventPayload {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Record<string, unknown>;
  return (
    typeof payload.appointmentId === "string" &&
    typeof payload.slotId === "string" &&
    Number.isInteger(payload.dayIndex) &&
    typeof payload.startMinute === "number" &&
    typeof payload.endMinute === "number" &&
    typeof payload.clientX === "number" &&
    typeof payload.clientY === "number"
  );
}

function isEmptyCellClickPayload(value: unknown): value is EmptyCellClickEventPayload {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Record<string, unknown>;
  return (
    Number.isInteger(payload.dayIndex) &&
    typeof payload.minuteOfDay === "number" &&
    typeof payload.clientX === "number" &&
    typeof payload.clientY === "number"
  );
}

function isSlotActionPayload(value: unknown): value is SlotActionEventPayload {
  return Boolean(value && typeof value === "object" && typeof (value as Record<string, unknown>).slotId === "string");
}

function isAppointmentActionPayload(value: unknown): value is AppointmentActionEventPayload {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as Record<string, unknown>).appointmentId === "string"
  );
}

function isCreateSlotPayload(value: unknown): value is CreateSlotActionEventPayload {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Record<string, unknown>;
  return (
    typeof payload.slotId === "string" &&
    typeof payload.startIso === "string" &&
    typeof payload.endIso === "string" &&
    typeof payload.assigneeId === "string" &&
    typeof payload.createdBy === "string"
  );
}

function popoverStyleFromPoint(clientX: number, clientY: number): Record<string, string> {
  const width = 340;
  const offset = 12;
  const viewportWidth = typeof window === "undefined" ? width + offset * 2 : window.innerWidth;
  const left = Math.min(clientX + offset, Math.max(offset, viewportWidth - width - offset));
  const top = Math.max(offset, clientY + offset);
  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
  };
}

export const MaiBoard = defineComponent({
  name: "MaiBoard",
  emits: {
    "navigate-week": (shift: WeekShift) => shift === -1 || shift === 0 || shift === 1,
    "slot-click": (payload: SlotClickEventPayload) => isSlotClickPayload(payload),
    "appointment-click": (payload: AppointmentClickEventPayload) =>
      isAppointmentClickPayload(payload),
    "empty-cell-click": (payload: EmptyCellClickEventPayload) =>
      isEmptyCellClickPayload(payload),
    "create-slot": (payload: CreateSlotActionEventPayload) => isCreateSlotPayload(payload),
    "book-slot": (payload: SlotActionEventPayload) => isSlotActionPayload(payload),
    "cancel-slot": (payload: SlotActionEventPayload) => isSlotActionPayload(payload),
    "delete-slot": (payload: SlotActionEventPayload) => isSlotActionPayload(payload),
    "cancel-appointment": (payload: AppointmentActionEventPayload) =>
      isAppointmentActionPayload(payload),
    "delete-appointment": (payload: AppointmentActionEventPayload) =>
      isAppointmentActionPayload(payload),
  },
  props: {
    layout: {
      type: Object as () => WeeklyLayout | null,
      required: false,
      default: null,
    },
    title: {
      type: String,
      required: false,
      default: "Availability",
    },
    subtitle: {
      type: String,
      required: false,
      default: "Weekly clinical planning",
    },
    anchorDate: {
      type: String,
      required: true,
    },
    isLoading: {
      type: Boolean,
      required: false,
      default: false,
    },
    errorMessage: {
      type: String as PropType<string | null>,
      required: false,
      default: null,
    },
    visibleStartMinute: {
      type: Number,
      required: false,
      default: 0,
      validator: (value: unknown) => isMinuteRange(value),
    },
    visibleEndMinute: {
      type: Number,
      required: false,
      default: 1440,
      validator: (value: unknown) => isMinuteRange(value),
    },
    timeLabelFormat: {
      type: String as PropType<TimeLabelFormat>,
      required: false,
      default: "24h",
      validator: (value: unknown) => value === "24h" || value === "12h",
    },
    emptyStateText: {
      type: String,
      required: false,
      default: "No events",
    },
    actionAssigneeId: {
      type: String,
      required: false,
      default: "",
    },
    actionCreatedBy: {
      type: String,
      required: false,
      default: "",
    },
    actionBusy: {
      type: Boolean,
      required: false,
      default: false,
    },
    defaultSlotDurationMinutes: {
      type: Number,
      required: false,
      default: 30,
    },
    showActionOverlay: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  setup(props, { emit }) {
    const selectedSlot = ref<SlotClickEventPayload | null>(null);
    const selectedAppointment = ref<AppointmentClickEventPayload | null>(null);
    const pendingSlotDraft = ref<EmptyCellClickEventPayload | null>(null);

    const slotCount = computed(() => props.layout?.slots.length ?? 0);
    const appointmentCount = computed(() => props.layout?.appointments.length ?? 0);
    const weekStartIso = computed(() => props.layout?.week_start ?? startOfWeekIso(props.anchorDate));
    const weekEndIso = computed(() => props.layout?.week_end ?? addDaysIso(weekStartIso.value, 6));
    const weekLabel = computed(() => weekRangeLabel(weekStartIso.value, weekEndIso.value));

    const visibleWindow = computed(() =>
      normalizeVisibleWindow(props.visibleStartMinute, props.visibleEndMinute)
    );
    const hourTicks = computed(() =>
      createHourTicks(visibleWindow.value.startMinute, visibleWindow.value.endMinute)
    );
    const totalVisibleMinutes = computed(() =>
      visibleWindow.value.endMinute - visibleWindow.value.startMinute ||
      DEFAULT_TOTAL_VISIBLE_MINUTES
    );
    const minuteTextFormatter = computed(
      () => (minute: number) => formatMinuteLabel(minute, props.timeLabelFormat)
    );

    const calendarEvents = computed(() => mapCalendarEvents(props.layout));
    const dayColumns = computed(() =>
      buildDayColumns(weekStartIso.value, calendarEvents.value)
    );
    const activePopoverStyle = computed(() => {
      const point =
        pendingSlotDraft.value ?? selectedSlot.value ?? selectedAppointment.value ?? null;
      if (!point) {
        return {};
      }
      return popoverStyleFromPoint(point.clientX, point.clientY);
    });

    function clearActions() {
      selectedSlot.value = null;
      selectedAppointment.value = null;
      pendingSlotDraft.value = null;
    }

    function handleSlotClick(payload: SlotClickEventPayload) {
      selectedSlot.value = payload;
      selectedAppointment.value = null;
      pendingSlotDraft.value = null;
      emit("slot-click", payload);
    }

    function handleAppointmentClick(payload: AppointmentClickEventPayload) {
      selectedAppointment.value = payload;
      selectedSlot.value = null;
      pendingSlotDraft.value = null;
      emit("appointment-click", payload);
    }

    function handleEmptyCellClick(payload: EmptyCellClickEventPayload) {
      pendingSlotDraft.value = payload;
      selectedSlot.value = null;
      selectedAppointment.value = null;
      emit("empty-cell-click", payload);
    }

    function emitCreateSlot(payload: CreateSlotActionEventPayload) {
      emit("create-slot", payload);
      clearActions();
    }

    function emitBookSlot(payload: SlotActionEventPayload) {
      emit("book-slot", payload);
      clearActions();
    }

    function emitCancelSlot(payload: SlotActionEventPayload) {
      emit("cancel-slot", payload);
      clearActions();
    }

    function emitDeleteSlot(payload: SlotActionEventPayload) {
      emit("delete-slot", payload);
      clearActions();
    }

    function emitCancelAppointment(payload: AppointmentActionEventPayload) {
      emit("cancel-appointment", payload);
      clearActions();
    }

    function emitDeleteAppointment(payload: AppointmentActionEventPayload) {
      emit("delete-appointment", payload);
      clearActions();
    }

    return () => (
      <section class="mai-board mai-board__panel">
        <MaiWeekHeader
          title={props.title}
          subtitle={props.subtitle}
          weekLabel={weekLabel.value}
          slotCount={slotCount.value}
          appointmentCount={appointmentCount.value}
          isLoading={props.isLoading}
          onNavigateWeek={(shift: WeekShift) => emit("navigate-week", shift)}
        />

        {props.errorMessage ? <p class="mai-board__error">{props.errorMessage}</p> : null}

        <div class="mai-board__calendar-scroll">
          <div class="mai-board__calendar">
            <MaiTimeGutter
              hourTicks={hourTicks.value}
              minuteLabel={minuteTextFormatter.value}
            />
            {dayColumns.value.map((column) => (
              <MaiDayColumn
                column={column}
                hourTicks={hourTicks.value}
                emptyStateText={props.emptyStateText}
                minuteLabel={minuteTextFormatter.value}
                visibleStartMinute={visibleWindow.value.startMinute}
                visibleEndMinute={visibleWindow.value.endMinute}
                totalVisibleMinutes={totalVisibleMinutes.value}
                onSlotClick={handleSlotClick}
                onAppointmentClick={handleAppointmentClick}
                onEmptyCellClick={handleEmptyCellClick}
                key={column.dayIndex}
              />
            ))}
          </div>
        </div>
        {props.showActionOverlay && pendingSlotDraft.value && props.actionAssigneeId && props.actionCreatedBy ? (
          <div class="mai-action-popover" style={activePopoverStyle.value}>
            <MaiCreateSlotCard
              draft={pendingSlotDraft.value}
              weekStartIso={weekStartIso.value}
              assigneeId={props.actionAssigneeId}
              createdBy={props.actionCreatedBy}
              defaultDurationMinutes={props.defaultSlotDurationMinutes}
              busy={props.actionBusy}
              {...{ "onCreate-slot": emitCreateSlot }}
              onClose={clearActions}
            />
          </div>
        ) : null}
        {props.showActionOverlay && selectedSlot.value ? (
          <div class="mai-action-popover" style={activePopoverStyle.value}>
            <MaiSlotActionsCard
              slot={selectedSlot.value}
              busy={props.actionBusy}
              {...{
                "onBook-slot": emitBookSlot,
                "onCancel-slot": emitCancelSlot,
                "onDelete-slot": emitDeleteSlot,
              }}
              onClose={clearActions}
            />
          </div>
        ) : null}
        {props.showActionOverlay && selectedAppointment.value ? (
          <div class="mai-action-popover" style={activePopoverStyle.value}>
            <MaiAppointmentActionsCard
              appointment={selectedAppointment.value}
              busy={props.actionBusy}
              {...{
                "onCancel-appointment": emitCancelAppointment,
                "onDelete-appointment": emitDeleteAppointment,
              }}
              onClose={clearActions}
            />
          </div>
        ) : null}
      </section>
    );
  },
});
