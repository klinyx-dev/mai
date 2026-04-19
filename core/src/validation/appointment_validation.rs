use crate::application::errors::{BusinessRuleError, ReferentialError, StructuralError};
use crate::domain::appointment::Appointment;
use crate::domain::ids::{AppointmentId, SlotId};
use crate::state::schedule_state::ScheduleState;

pub fn ensure_title_not_empty(title: &str) -> Result<(), StructuralError> {
    if title.trim().is_empty() {
        return Err(StructuralError::EmptyTitle);
    }
    Ok(())
}

pub fn ensure_appointment_exists<'a>(
    state: &'a ScheduleState,
    appointment_id: &AppointmentId,
) -> Result<&'a Appointment, ReferentialError> {
    state
        .appointments
        .get(appointment_id)
        .ok_or(ReferentialError::AppointmentNotFound)
}

pub fn ensure_no_appointment_for_slot(
    state: &ScheduleState,
    slot_id: &SlotId,
) -> Result<(), BusinessRuleError> {
    if state
        .appointments
        .values()
        .any(|appointment| &appointment.slot_id == slot_id)
    {
        return Err(BusinessRuleError::AppointmentAlreadyExistsForSlot);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{ensure_no_appointment_for_slot, ensure_title_not_empty};
    use crate::domain::appointment::Appointment;
    use crate::domain::ids::{ActorId, AppointmentId, SlotId};
    use crate::state::schedule_state::ScheduleState;

    #[test]
    fn rejects_blank_appointment_title() {
        assert!(ensure_title_not_empty("   ").is_err());
        assert!(ensure_title_not_empty("Consultation").is_ok());
    }

    #[test]
    fn rejects_when_slot_already_has_appointment() {
        let mut state = ScheduleState::new();
        let slot_id = SlotId::new("slot-1");

        state.appointments.insert(
            AppointmentId::new("appt-1"),
            Appointment::new(
                AppointmentId::new("appt-1"),
                slot_id.clone(),
                vec![ActorId::new("invitee-1")],
                "Consultation",
                ActorId::new("creator-1"),
            ),
        );

        let result = ensure_no_appointment_for_slot(&state, &slot_id);
        assert!(result.is_err());
    }
}
