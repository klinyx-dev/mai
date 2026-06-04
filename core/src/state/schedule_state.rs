use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use crate::domain::appointment::Appointment;
use crate::domain::blackout_window::BlackoutWindow;
use crate::domain::ids::{ActorId, AppointmentId, SlotId};
use crate::domain::recurring_template::RecurringTemplate;
use crate::domain::slot::Slot;

#[derive(Clone, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct ScheduleState {
    pub(crate) slots: HashMap<SlotId, Slot>,
    pub(crate) appointments: HashMap<AppointmentId, Appointment>,
    pub(crate) recurring_templates: HashMap<String, RecurringTemplate>,
    pub(crate) blackout_windows: Vec<BlackoutWindow>,
}

impl ScheduleState {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn slot(&self, slot_id: &SlotId) -> Option<&Slot> {
        self.slots.get(slot_id)
    }

    pub fn slot_mut(&mut self, slot_id: &SlotId) -> Option<&mut Slot> {
        self.slots.get_mut(slot_id)
    }

    pub fn slots_len(&self) -> usize {
        self.slots.len()
    }

    pub fn contains_slot(&self, slot_id: &SlotId) -> bool {
        self.slots.contains_key(slot_id)
    }

    pub fn slots_iter(&self) -> impl Iterator<Item = &Slot> {
        self.slots.values()
    }

    pub(crate) fn insert_slot(&mut self, slot_id: SlotId, slot: Slot) {
        self.slots.insert(slot_id, slot);
    }

    pub(crate) fn remove_slot(&mut self, slot_id: &SlotId) -> Option<Slot> {
        self.slots.remove(slot_id)
    }

    pub fn appointment(&self, appointment_id: &AppointmentId) -> Option<&Appointment> {
        self.appointments.get(appointment_id)
    }

    pub fn appointments_len(&self) -> usize {
        self.appointments.len()
    }

    pub fn contains_appointment(&self, appointment_id: &AppointmentId) -> bool {
        self.appointments.contains_key(appointment_id)
    }

    pub fn appointments_iter(&self) -> impl Iterator<Item = &Appointment> {
        self.appointments.values()
    }

    pub fn recurring_templates_iter(&self) -> impl Iterator<Item = &RecurringTemplate> {
        self.recurring_templates.values()
    }

    pub fn blackout_windows_iter(&self) -> impl Iterator<Item = &BlackoutWindow> {
        self.blackout_windows.iter()
    }

    pub fn contains_blackout_window(&self, resource_owner_id: &ActorId, blackout_id: &str) -> bool {
        self.blackout_windows_iter().any(|window| {
            &window.resource_owner_id == resource_owner_id && window.blackout_id == blackout_id
        })
    }

    pub(crate) fn appointment_ids_sorted(&self) -> Vec<AppointmentId> {
        let mut appointment_ids: Vec<_> = self.appointments.keys().cloned().collect();
        appointment_ids.sort_by(|a, b| a.as_str().cmp(b.as_str()));
        appointment_ids
    }

    pub(crate) fn insert_appointment(
        &mut self,
        appointment_id: AppointmentId,
        appointment: Appointment,
    ) {
        self.appointments.insert(appointment_id, appointment);
    }

    pub(crate) fn remove_appointment(
        &mut self,
        appointment_id: &AppointmentId,
    ) -> Option<Appointment> {
        self.appointments.remove(appointment_id)
    }

    pub(crate) fn insert_recurring_template(&mut self, template: RecurringTemplate) {
        self.recurring_templates
            .insert(template.template_id.clone(), template);
    }

    pub(crate) fn insert_blackout_window(&mut self, blackout: BlackoutWindow) {
        self.blackout_windows.push(blackout);
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
        assert!(state.recurring_templates.is_empty());
        assert!(state.blackout_windows.is_empty());
    }
}
