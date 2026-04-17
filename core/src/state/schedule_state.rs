use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use crate::domain::appointment::Appointment;
use crate::domain::ids::{AppointmentId, SlotId};
use crate::domain::slot::Slot;

#[derive(Clone, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct ScheduleState {
    pub slots: HashMap<SlotId, Slot>,
    pub appointments: HashMap<AppointmentId, Appointment>,
}

impl ScheduleState {
    pub fn new() -> Self {
        Self::default()
    }
}

#[cfg(test)]
mod tests {
    use super::ScheduleState;

    #[test]
    fn new_state_is_empty() {
        let state = ScheduleState::new();

        assert!(state.slots.is_empty());
        assert!(state.appointments.is_empty());
    }
}
