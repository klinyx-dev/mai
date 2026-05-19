use crate::application::command_result::CommandResult;
use crate::application::errors::BusinessRuleError;
use crate::application::errors::ReferentialError;
use crate::application::policies::slot_policy::ensure_no_overlap_for_resource_owner;
use crate::commands::add_slot::AddSlotCommand;
use crate::commands::cancel_slot::CancelSlotCommand;
use crate::commands::delete_slot::DeleteSlotCommand;
use crate::commands::reschedule_slot::RescheduleSlotCommand;
use crate::domain::slot::Slot;
use crate::validation::invariants::validate_slot_appointment_invariants;
use crate::validation::slot_validation::{ensure_slot_exists, ensure_slot_is_deletable};

use super::SchedulerService;

impl SchedulerService {
    pub fn add_slot(&mut self, cmd: AddSlotCommand) -> CommandResult {
        if self.state.contains_slot(&cmd.slot_id) {
            return Err(BusinessRuleError::SlotIdAlreadyExists.into());
        }

        self.ensure_actor_exists(
            &cmd.resource_owner_id,
            ReferentialError::ResourceOwnerNotFound,
        )?;
        self.ensure_actor_exists(&cmd.created_by, ReferentialError::CreatorNotFound)?;

        let time = Slot::rebuilt_time_range(cmd.start, cmd.end)?;
        let slot = Slot::new(
            cmd.slot_id.clone(),
            time,
            cmd.resource_owner_id,
            cmd.created_by,
        );

        ensure_no_overlap_for_resource_owner(&self.state, &slot)?;
        self.state.insert_slot(cmd.slot_id, slot);
        validate_slot_appointment_invariants(&self.state)?;
        Ok(())
    }

    pub fn delete_slot(&mut self, cmd: DeleteSlotCommand) -> CommandResult {
        let slot = ensure_slot_exists(&self.state, &cmd.slot_id)?;
        ensure_slot_is_deletable(slot)?;

        self.state.remove_slot(&cmd.slot_id);
        validate_slot_appointment_invariants(&self.state)?;
        Ok(())
    }

    pub fn cancel_slot(&mut self, cmd: CancelSlotCommand) -> CommandResult {
        let slot = self
            .state
            .slot_mut(&cmd.slot_id)
            .ok_or(ReferentialError::SlotNotFound)?;
        slot.cancel()?;

        validate_slot_appointment_invariants(&self.state)?;
        Ok(())
    }

    pub fn reschedule_slot(&mut self, cmd: RescheduleSlotCommand) -> CommandResult {
        self.ensure_actor_exists(&cmd.updated_by, ReferentialError::UpdaterNotFound)?;

        let slot = ensure_slot_exists(&self.state, &cmd.slot_id)?;
        let time = Slot::rebuilt_time_range(cmd.new_start, cmd.new_end)?;

        let candidate = Slot::with_status(
            slot.id.clone(),
            time.clone(),
            slot.resource_owner_id.clone(),
            slot.created_by.clone(),
            slot.status,
        );
        ensure_no_overlap_for_resource_owner(&self.state, &candidate)?;

        let slot = self
            .state
            .slot_mut(&cmd.slot_id)
            .ok_or(ReferentialError::SlotNotFound)?;
        slot.reschedule(time)?;

        validate_slot_appointment_invariants(&self.state)?;
        Ok(())
    }
}
