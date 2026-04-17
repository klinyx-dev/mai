use crate::application::command_result::CommandResult;
use crate::application::errors::{BusinessRuleError, ReferentialError, StructuralError};
use crate::commands::add_appointment::AddAppointmentCommand;
use crate::commands::add_slot::AddSlotCommand;
use crate::commands::cancel_slot::CancelSlotCommand;
use crate::commands::delete_appointment::DeleteAppointmentCommand;
use crate::commands::delete_slot::DeleteSlotCommand;
use crate::domain::appointment::Appointment;
use crate::domain::enums::SlotStatus;
use crate::domain::slot::Slot;
use crate::domain::time_range::TimeRange;
use crate::state::schedule_state::ScheduleState;

#[derive(Clone, Debug, Default)]
pub struct SchedulerService {
    state: ScheduleState,
}

impl SchedulerService {
    pub fn new() -> Self {
        Self {
            state: ScheduleState::new(),
        }
    }

    pub fn from_state(state: ScheduleState) -> Self {
        Self { state }
    }

    pub fn state(&self) -> &ScheduleState {
        &self.state
    }

    pub fn add_slot(&mut self, cmd: AddSlotCommand) -> CommandResult {
        let time = TimeRange::new(cmd.start, cmd.end)
            .map_err(|_| StructuralError::InvalidTimeRange)?;
        let slot = Slot::new(cmd.slot_id.clone(), time, cmd.assignee_id, cmd.created_by);
        
        self.state.slots.insert(cmd.slot_id, slot);
        Ok(())
    }

    pub fn delete_slot(&mut self, cmd: DeleteSlotCommand) -> CommandResult {
        let slot = self
            .state
            .slots
            .get(&cmd.slot_id)
            .ok_or(ReferentialError::SlotNotFound)?;

        if slot.status == SlotStatus::Booked {
            return Err(BusinessRuleError::CannotDeleteBookedSlot.into());
        }

        self.state.slots.remove(&cmd.slot_id);
        Ok(())
    }

    pub fn cancel_slot(&mut self, cmd: CancelSlotCommand) -> CommandResult {
        let slot = self
            .state
            .slots
            .get_mut(&cmd.slot_id)
            .ok_or(ReferentialError::SlotNotFound)?;

        match slot.status {
            SlotStatus::Available => {
                slot.status = SlotStatus::Cancelled;
                Ok(())
            }
            
            SlotStatus::Booked | SlotStatus::Cancelled => {
                Err(BusinessRuleError::SlotNotAvailable.into())
            }
        }
    }

    pub fn add_appointment(&mut self, cmd: AddAppointmentCommand) -> CommandResult {
        if cmd.title.trim().is_empty() {
            return Err(StructuralError::EmptyTitle.into());
        }

        let slot = self
            .state
            .slots
            .get(&cmd.slot_id)
            .ok_or(ReferentialError::SlotNotFound)?;

        match slot.status {
            SlotStatus::Available => {}
            SlotStatus::Booked => return Err(BusinessRuleError::SlotAlreadyBooked.into()),
            SlotStatus::Cancelled => return Err(BusinessRuleError::SlotCancelled.into()),
        }

        if self
            .state
            .appointments
            .values()
            .any(|appointment| appointment.slot_id == cmd.slot_id)
        {
            return Err(BusinessRuleError::AppointmentAlreadyExistsForSlot.into());
        }

        let appointment = Appointment::new(
            cmd.appointment_id.clone(),
            cmd.slot_id.clone(),
            cmd.invitee_ids,
            cmd.title,
            cmd.created_by,
        );

        self.state.appointments.insert(cmd.appointment_id, appointment);

        let slot = self
            .state
            .slots
            .get_mut(&cmd.slot_id)
            .ok_or(ReferentialError::SlotNotFound)?;
        slot.status = SlotStatus::Booked;

        Ok(())
    }

    pub fn delete_appointment(&mut self, cmd: DeleteAppointmentCommand) -> CommandResult {
        let appointment = self
            .state
            .appointments
            .get(&cmd.appointment_id)
            .ok_or(ReferentialError::AppointmentNotFound)?;

        let slot_id = appointment.slot_id.clone();

        self.state
            .slots
            .get(&slot_id)
            .ok_or(ReferentialError::SlotNotFound)?;

        self.state.appointments.remove(&cmd.appointment_id);

        let slot = self
            .state
            .slots
            .get_mut(&slot_id)
            .ok_or(ReferentialError::SlotNotFound)?;
        slot.status = SlotStatus::Available;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::SchedulerService;
    use crate::application::errors::{BusinessRuleError, ReferentialError, SchedulerError};
    use crate::commands::add_appointment::AddAppointmentCommand;
    use crate::commands::add_slot::AddSlotCommand;
    use crate::commands::cancel_slot::CancelSlotCommand;
    use crate::commands::delete_appointment::DeleteAppointmentCommand;
    use crate::commands::delete_slot::DeleteSlotCommand;
    use crate::domain::enums::SlotStatus;
    use crate::domain::ids::{ActorId, AppointmentId, SlotId};
    use chrono::{TimeZone, Utc};

    fn add_slot_cmd(slot_id: &str) -> AddSlotCommand {
        AddSlotCommand {
            slot_id: SlotId::new(slot_id),
            start: Utc.with_ymd_and_hms(2026, 1, 5, 9, 0, 0).unwrap(),
            end: Utc.with_ymd_and_hms(2026, 1, 5, 10, 0, 0).unwrap(),
            assignee_id: ActorId::new("assignee-1"),
            created_by: ActorId::new("creator-1"),
        }
    }

    fn add_appointment_cmd(appointment_id: &str, slot_id: &str) -> AddAppointmentCommand {
        AddAppointmentCommand {
            appointment_id: AppointmentId::new(appointment_id),
            slot_id: SlotId::new(slot_id),
            invitee_ids: vec![ActorId::new("invitee-1")],
            title: "Consultation".to_string(),
            created_by: ActorId::new("creator-2"),
        }
    }

    #[test]
    fn booking_creates_exactly_one_appointment_and_marks_slot_booked() {
        let mut service = SchedulerService::new();
        service.add_slot(add_slot_cmd("slot-1")).unwrap();

        service
            .add_appointment(add_appointment_cmd("appt-1", "slot-1"))
            .unwrap();

        assert_eq!(service.state().appointments.len(), 1);
        assert_eq!(
            service
                .state()
                .slots
                .get(&SlotId::new("slot-1"))
                .expect("slot exists")
                .status,
            SlotStatus::Booked
        );
    }

    #[test]
    fn deleting_appointment_restores_slot_availability() {
        let mut service = SchedulerService::new();
        service.add_slot(add_slot_cmd("slot-1")).unwrap();
        service
            .add_appointment(add_appointment_cmd("appt-1", "slot-1"))
            .unwrap();

        service
            .delete_appointment(DeleteAppointmentCommand {
                appointment_id: AppointmentId::new("appt-1"),
            })
            .unwrap();

        assert!(service.state().appointments.is_empty());
        assert_eq!(
            service
                .state()
                .slots
                .get(&SlotId::new("slot-1"))
                .expect("slot exists")
                .status,
            SlotStatus::Available
        );
    }

    #[test]
    fn booked_slot_cannot_be_deleted() {
        let mut service = SchedulerService::new();
        service.add_slot(add_slot_cmd("slot-1")).unwrap();
        service
            .add_appointment(add_appointment_cmd("appt-1", "slot-1"))
            .unwrap();

        let result = service.delete_slot(DeleteSlotCommand {
            slot_id: SlotId::new("slot-1"),
        });

        assert_eq!(
            result.expect_err("booked slot deletion must fail"),
            SchedulerError::Business(BusinessRuleError::CannotDeleteBookedSlot)
        );
    }

    #[test]
    fn cannot_book_cancelled_slot() {
        let mut service = SchedulerService::new();
        service.add_slot(add_slot_cmd("slot-1")).unwrap();
        service
            .cancel_slot(CancelSlotCommand {
                slot_id: SlotId::new("slot-1"),
            })
            .unwrap();

        let result = service.add_appointment(add_appointment_cmd("appt-1", "slot-1"));

        assert_eq!(
            result.expect_err("booking cancelled slot must fail"),
            SchedulerError::Business(BusinessRuleError::SlotCancelled)
        );
        assert!(service.state().appointments.is_empty());
    }

    #[test]
    fn delete_appointment_fails_when_not_found() {
        let mut service = SchedulerService::new();
        let result = service.delete_appointment(DeleteAppointmentCommand {
            appointment_id: AppointmentId::new("missing"),
        });

        assert_eq!(
            result.expect_err("missing appointment must fail"),
            SchedulerError::Referential(ReferentialError::AppointmentNotFound)
        );
    }
}
