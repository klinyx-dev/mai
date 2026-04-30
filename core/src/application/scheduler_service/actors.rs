use crate::application::command_result::CommandResult;
use crate::application::errors::ReferentialError;

use super::SchedulerService;

impl SchedulerService {
    // Check if the actor exists
    pub(crate) fn ensure_actor_exists(
        &self,
        actor_id: &crate::domain::ActorId,
        error: ReferentialError,
    ) -> CommandResult {
        if let Some(actor_lookup) = &self.actor_lookup
            && !actor_lookup.actor_exists(actor_id)
        {
            return Err(error.into());
        }
        Ok(())
    }
}
