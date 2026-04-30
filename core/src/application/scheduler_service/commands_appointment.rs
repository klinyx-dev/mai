use crate::application::command_result::CommandResult;
use crate::application::errors::ReferentialError;
use crate::application::policies::appointment_policy::{
    ensure_actor_can_cancel_appointment, ensure_no_appointment_for_slot,
};
use crate::commands::add_appointment::AddAppointmentCommand;
use crate::commands::cancel_appointment::CancelAppointmentCommand;
use crate::commands::delete_appointment::DeleteAppointmentCommand;
use crate::domain::appointment::Appointment;
use crate::validation::appointment_validation::{
    ensure_appointment_exists, ensure_title_not_empty,
};
use crate::validation::invariants::validate_slot_appointment_invariants;
use crate::validation::slot_validation::{ensure_slot_exists, ensure_slot_is_available};

use super::SchedulerService;

impl SchedulerService {
    pub fn add_appointment(&mut self, cmd: AddAppointmentCommand) -> CommandResult {
        self.ensure_actor_exists(&cmd.created_by, ReferentialError::CreatorNotFound)?;
        for invitee_id in &cmd.invitee_ids {
            self.ensure_actor_exists(invitee_id, ReferentialError::InviteeNotFound)?;
        }

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

        {
            let slot = self
                .state
                .slot_mut(&cmd.slot_id)
                .ok_or(ReferentialError::SlotNotFound)?;
            slot.book()?;
        }

        self.state
            .insert_appointment(cmd.appointment_id, appointment);

        validate_slot_appointment_invariants(&self.state)?;
        Ok(())
    }

    pub fn cancel_appointment(&mut self, cmd: CancelAppointmentCommand) -> CommandResult {
        self.ensure_actor_exists(&cmd.cancelled_by, ReferentialError::CancellerNotFound)?;

        let appointment = ensure_appointment_exists(&self.state, &cmd.appointment_id)?;
        let slot_id = appointment.slot_id.clone();
        let slot = ensure_slot_exists(&self.state, &slot_id)?;

        ensure_actor_can_cancel_appointment(appointment, slot, &cmd.cancelled_by)?;

        self.state.remove_appointment(&cmd.appointment_id);

        let slot = self
            .state
            .slot_mut(&slot_id)
            .ok_or(ReferentialError::SlotNotFound)?;
        slot.make_available();

        validate_slot_appointment_invariants(&self.state)?;
        Ok(())
    }

    pub fn delete_appointment(&mut self, cmd: DeleteAppointmentCommand) -> CommandResult {
        let appointment = ensure_appointment_exists(&self.state, &cmd.appointment_id)?;
        let slot_id = appointment.slot_id.clone();

        ensure_slot_exists(&self.state, &slot_id)?;

        self.state.remove_appointment(&cmd.appointment_id);

        let slot = self
            .state
            .slot_mut(&slot_id)
            .ok_or(ReferentialError::SlotNotFound)?;
        slot.make_available();

        validate_slot_appointment_invariants(&self.state)?;
        Ok(())
    }
}
