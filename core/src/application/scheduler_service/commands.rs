use crate::application::command_result::CommandResult;
use crate::application::errors::{ReferentialError, StructuralError};
use crate::commands::add_appointment::AddAppointmentCommand;
use crate::commands::add_slot::AddSlotCommand;
use crate::commands::cancel_appointment::CancelAppointmentCommand;
use crate::commands::cancel_slot::CancelSlotCommand;
use crate::commands::delete_appointment::DeleteAppointmentCommand;
use crate::commands::delete_slot::DeleteSlotCommand;
use crate::commands::reschedule_slot::RescheduleSlotCommand;
use crate::domain::appointment::Appointment;
use crate::domain::enums::SlotStatus;
use crate::domain::slot::Slot;
use crate::domain::time_range::TimeRange;
use crate::validation::appointment_validation::{
    ensure_actor_can_cancel_appointment, ensure_appointment_exists, ensure_no_appointment_for_slot,
    ensure_title_not_empty,
};
use crate::validation::invariants::validate_slot_appointment_invariants;
use crate::validation::slot_validation::{
    ensure_no_overlap_for_assignee, ensure_slot_exists, ensure_slot_is_available,
    ensure_slot_is_cancellable, ensure_slot_is_deletable,
};

use super::SchedulerService;

impl SchedulerService {
    pub fn add_slot(&mut self, cmd: AddSlotCommand) -> CommandResult {
        self.ensure_actor_exists(&cmd.assignee_id, ReferentialError::AssigneeNotFound)?;
        self.ensure_actor_exists(&cmd.created_by, ReferentialError::CreatorNotFound)?;

        let time =
            TimeRange::new(cmd.start, cmd.end).map_err(|_| StructuralError::InvalidTimeRange)?;
        let slot = Slot::new(cmd.slot_id.clone(), time, cmd.assignee_id, cmd.created_by);

        ensure_no_overlap_for_assignee(&self.state, &slot)?;
        self.state.slots.insert(cmd.slot_id, slot);
        validate_slot_appointment_invariants(&self.state)?;
        Ok(())
    }

    pub fn delete_slot(&mut self, cmd: DeleteSlotCommand) -> CommandResult {
        let slot = ensure_slot_exists(&self.state, &cmd.slot_id)?;
        ensure_slot_is_deletable(slot)?;

        self.state.slots.remove(&cmd.slot_id);
        validate_slot_appointment_invariants(&self.state)?;
        Ok(())
    }

    pub fn cancel_slot(&mut self, cmd: CancelSlotCommand) -> CommandResult {
        let slot = ensure_slot_exists(&self.state, &cmd.slot_id)?;
        ensure_slot_is_cancellable(slot)?;

        let slot = self
            .state
            .slots
            .get_mut(&cmd.slot_id)
            .ok_or(ReferentialError::SlotNotFound)?;
        slot.status = SlotStatus::Cancelled;

        validate_slot_appointment_invariants(&self.state)?;
        Ok(())
    }

    pub fn add_appointment(&mut self, cmd: AddAppointmentCommand) -> CommandResult {
        self.ensure_actor_exists(&cmd.created_by, ReferentialError::CreatorNotFound)?;

        ensure_title_not_empty(&cmd.title)?;
        let slot = ensure_slot_exists(&self.state, &cmd.slot_id)?;
        ensure_slot_is_available(slot)?;
        ensure_no_appointment_for_slot(&self.state, &cmd.slot_id)?;

        let appointment = Appointment::new(
            cmd.appointment_id.clone(),
            cmd.slot_id.clone(),
            cmd.invitee_ids,
            cmd.title,
            cmd.created_by,
        );

        self.state
            .appointments
            .insert(cmd.appointment_id, appointment);

        let slot = self
            .state
            .slots
            .get_mut(&cmd.slot_id)
            .ok_or(ReferentialError::SlotNotFound)?;
        slot.status = SlotStatus::Booked;

        validate_slot_appointment_invariants(&self.state)?;
        Ok(())
    }

    pub fn cancel_appointment(&mut self, cmd: CancelAppointmentCommand) -> CommandResult {
        let appointment = ensure_appointment_exists(&self.state, &cmd.appointment_id)?;
        let slot_id = appointment.slot_id.clone();
        let slot = ensure_slot_exists(&self.state, &slot_id)?;

        ensure_actor_can_cancel_appointment(appointment, slot, &cmd.cancelled_by)?;

        self.state.appointments.remove(&cmd.appointment_id);

        let slot = self
            .state
            .slots
            .get_mut(&slot_id)
            .ok_or(ReferentialError::SlotNotFound)?;
        slot.status = SlotStatus::Available;

        validate_slot_appointment_invariants(&self.state)?;
        Ok(())
    }

    pub fn delete_appointment(&mut self, cmd: DeleteAppointmentCommand) -> CommandResult {
        let appointment = ensure_appointment_exists(&self.state, &cmd.appointment_id)?;
        let slot_id = appointment.slot_id.clone();

        ensure_slot_exists(&self.state, &slot_id)?;

        self.state.appointments.remove(&cmd.appointment_id);

        let slot = self
            .state
            .slots
            .get_mut(&slot_id)
            .ok_or(ReferentialError::SlotNotFound)?;
        slot.status = SlotStatus::Available;

        validate_slot_appointment_invariants(&self.state)?;
        Ok(())
    }

    pub fn reschedule_slot(&mut self, cmd: RescheduleSlotCommand) -> CommandResult {
        self.ensure_actor_exists(&cmd.updated_by, ReferentialError::CreatorNotFound)?;

        let slot = ensure_slot_exists(&self.state, &cmd.slot_id)?;
        ensure_slot_is_cancellable(slot)?;

        let time = TimeRange::new(cmd.new_start, cmd.new_end)
            .map_err(|_| StructuralError::InvalidTimeRange)?;

        let candidate = Slot::with_status(
            slot.id.clone(),
            time.clone(),
            slot.assignee_id.clone(),
            slot.created_by.clone(),
            slot.status,
        );
        ensure_no_overlap_for_assignee(&self.state, &candidate)?;

        let slot = self
            .state
            .slots
            .get_mut(&cmd.slot_id)
            .ok_or(ReferentialError::SlotNotFound)?;
        slot.time = time;

        validate_slot_appointment_invariants(&self.state)?;
        Ok(())
    }
}
