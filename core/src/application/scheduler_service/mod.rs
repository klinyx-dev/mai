use crate::application::ActorLookup;
use crate::state::schedule_state::ScheduleState;
use std::fmt;
use std::sync::Arc;

mod actors;
mod commands;
mod queries;

#[cfg(test)]
mod tests;

#[derive(Clone, Default)]
pub struct SchedulerService {
    state: ScheduleState,
    actor_lookup: Option<Arc<dyn ActorLookup>>,
}

impl fmt::Debug for SchedulerService {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("SchedulerService")
            .field("state", &self.state)
            .field("actor_lookup_configured", &self.actor_lookup.is_some())
            .finish()
    }
}

impl SchedulerService {
    pub fn new() -> Self {
        Self {
            state: ScheduleState::new(),
            actor_lookup: None,
        }
    }

    pub fn from_state(state: ScheduleState) -> Self {
        Self {
            state,
            actor_lookup: None,
        }
    }

    pub fn with_actor_lookup(actor_lookup: Arc<dyn ActorLookup>) -> Self {
        Self {
            state: ScheduleState::new(),
            actor_lookup: Some(actor_lookup),
        }
    }

    pub fn from_state_with_actor_lookup(
        state: ScheduleState,
        actor_lookup: Option<Arc<dyn ActorLookup>>,
    ) -> Self {
        Self {
            state,
            actor_lookup,
        }
    }

    pub fn set_actor_lookup(&mut self, actor_lookup: Option<Arc<dyn ActorLookup>>) {
        self.actor_lookup = actor_lookup;
    }

    pub fn state(&self) -> &ScheduleState {
        &self.state
    }
}
