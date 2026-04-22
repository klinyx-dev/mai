import { defineComponent, h } from "vue";
import { MAI_BOARD_EVENTS, maiBoardEmits, maiBoardProps } from "./board/api";
import { useMaiBoardController } from "./board/state/controller";
import { MaiActionOverlay } from "./board/ui/MaiActionOverlay";
import { MaiDayColumn } from "./board/ui/MaiDayColumn";
import { MaiTimeGutter } from "./board/ui/MaiTimeGutter";
import { MaiWeekHeader } from "./board/ui/MaiWeekHeader";
import type { WeekShift } from "./types";

export const MaiBoard = defineComponent({
  name: "MaiBoard",
  emits: maiBoardEmits,
  props: maiBoardProps,
  setup(props, { emit }) {
    const controller = useMaiBoardController(props, emit);

    return () => (
      <section class="mai-board mai-board__panel">
        <MaiWeekHeader
          title={props.title}
          subtitle={props.subtitle}
          weekLabel={controller.weekLabel.value}
          slotCount={controller.slotCount.value}
          appointmentCount={controller.appointmentCount.value}
          isLoading={props.isLoading}
          onNavigateWeek={(shift: WeekShift) =>
            emit(MAI_BOARD_EVENTS.NAVIGATE_WEEK, shift)
          }
        />

        {props.errorMessage ? <p class="mai-board__error">{props.errorMessage}</p> : null}

        <div class="mai-board__calendar-scroll">
          <div class="mai-board__calendar">
            <MaiTimeGutter
              hourTicks={controller.hourTicks.value}
              minuteLabel={controller.minuteTextFormatter.value}
            />
            {controller.dayColumns.value.map((column) => (
              <MaiDayColumn
                column={column}
                hourTicks={controller.hourTicks.value}
                emptyStateText={props.emptyStateText}
                minuteLabel={controller.minuteTextFormatter.value}
                visibleStartMinute={controller.visibleWindow.value.startMinute}
                visibleEndMinute={controller.visibleWindow.value.endMinute}
                totalVisibleMinutes={controller.totalVisibleMinutes.value}
                onSlotClick={controller.handleSlotClick}
                onAppointmentClick={controller.handleAppointmentClick}
                onEmptyCellClick={controller.handleEmptyCellClick}
                key={column.dayIndex}
              />
            ))}
          </div>
        </div>

        <MaiActionOverlay
          show={props.showActionOverlay}
          pendingSlotDraft={controller.pendingSlotDraft.value}
          selectedSlot={controller.selectedSlot.value}
          selectedAppointment={controller.selectedAppointment.value}
          weekStartIso={controller.weekStartIso.value}
          actionAssigneeId={props.actionAssigneeId}
          actionCreatedBy={props.actionCreatedBy}
          defaultSlotDurationMinutes={props.defaultSlotDurationMinutes}
          actionBusy={props.actionBusy}
          onCreateSlot={controller.emitCreateSlot}
          onBookSlot={controller.emitBookSlot}
          onCancelSlot={controller.emitCancelSlot}
          onDeleteSlot={controller.emitDeleteSlot}
          onCancelAppointment={controller.emitCancelAppointment}
          onDeleteAppointment={controller.emitDeleteAppointment}
          onClear={controller.clearActions}
        />
      </section>
    );
  },
});
