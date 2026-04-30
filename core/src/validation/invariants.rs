use crate::application::errors::{BusinessRuleError, ReferentialError, SchedulerError};
use crate::state::schedule_state::ScheduleState;
use std::collections::HashSet;

// Validate that each appointment has a corresponding slot in the schedule state
pub fn validate_slot_appointment_invariants(state: &ScheduleState) -> Result<(), SchedulerError> {
    let appointment_ids = state.appointment_ids_sorted();
    let mut seen_slot_ids = HashSet::new();

    for id in appointment_ids {
        let appointment = state
            .appointment(&id)
            .ok_or(ReferentialError::AppointmentNotFound)?;

        if !state.contains_slot(&appointment.slot_id) {
            return Err(ReferentialError::SlotNotFound.into());
        }

        if !seen_slot_ids.insert(appointment.slot_id.clone()) {
            return Err(BusinessRuleError::AppointmentAlreadyExistsForSlot.into());
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::validate_slot_appointment_invariants;
    use crate::application::errors::{BusinessRuleError, ReferentialError, SchedulerError};
    use crate::domain::appointment::Appointment;
    use crate::domain::ids::{ActorId, AppointmentId, SlotId};
    use crate::domain::slot::Slot;
    use crate::domain::time_range::TimeRange;
    use crate::state::schedule_state::ScheduleState;
    use chrono::{TimeZone, Utc};

    fn make_slot(slot_id: &str) -> Slot {
        Slot::new(
            SlotId::new(slot_id),
            TimeRange::new(
                Utc.with_ymd_and_hms(2026, 1, 5, 9, 0, 0).unwrap(),
                Utc.with_ymd_and_hms(2026, 1, 5, 10, 0, 0).unwrap(),
            )
            .unwrap(),
            ActorId::new("owner-1"),
            ActorId::new("creator-1"),
        )
    }

    #[test]
    fn fails_when_appointment_references_missing_slot() {
        let mut state = ScheduleState::new();
        state.appointments.insert(
            AppointmentId::new("appt-1"),
            Appointment::new(
                AppointmentId::new("appt-1"),
                SlotId::new("missing-slot"),
                vec![ActorId::new("invitee-1")],
                "Consultation",
                ActorId::new("creator-1"),
            ),
        );

        let result = validate_slot_appointment_invariants(&state);
        assert_eq!(
            result.expect_err("missing slot must fail"),
            SchedulerError::Referential(ReferentialError::SlotNotFound)
        );
    }

    #[test]
    fn fails_when_multiple_appointments_share_same_slot() {
        let mut state = ScheduleState::new();
        let slot = make_slot("slot-1");
        state.slots.insert(slot.id.clone(), slot);

        state.appointments.insert(
            AppointmentId::new("appt-1"),
            Appointment::new(
                AppointmentId::new("appt-1"),
                SlotId::new("slot-1"),
                vec![ActorId::new("invitee-1")],
                "A",
                ActorId::new("creator-1"),
            ),
        );
        state.appointments.insert(
            AppointmentId::new("appt-2"),
            Appointment::new(
                AppointmentId::new("appt-2"),
                SlotId::new("slot-1"),
                vec![ActorId::new("invitee-2")],
                "B",
                ActorId::new("creator-2"),
            ),
        );

        let result = validate_slot_appointment_invariants(&state);
        assert_eq!(
            result.expect_err("duplicate slot booking must fail"),
            SchedulerError::Business(BusinessRuleError::AppointmentAlreadyExistsForSlot)
        );
    }
}
