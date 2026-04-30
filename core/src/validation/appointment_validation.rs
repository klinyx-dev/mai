use crate::application::errors::{ReferentialError, StructuralError};
use crate::domain::appointment::Appointment;
use crate::domain::ids::AppointmentId;
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
        .appointment(appointment_id)
        .ok_or(ReferentialError::AppointmentNotFound)
}

#[cfg(test)]
mod tests {
    use super::ensure_title_not_empty;

    #[test]
    fn rejects_blank_appointment_title() {
        assert!(ensure_title_not_empty("   ").is_err());
        assert!(ensure_title_not_empty("Consultation").is_ok());
    }
}
