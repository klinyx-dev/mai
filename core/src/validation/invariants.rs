use crate::application::errors::{BusinessRuleError, ReferentialError, SchedulerError};
use crate::state::schedule_state::ScheduleState;
use std::collections::HashMap;

// Validate that each appointment has a corresponding slot in the schedule state
pub fn validate_slot_appointment_invariants(state: &ScheduleState) -> Result<(), SchedulerError> {
    let appointment_ids = state.appointment_ids_sorted();
    let mut per_slot_counts: HashMap<_, usize> = HashMap::new();

    for id in appointment_ids {
        let appointment = state
            .appointment(&id)
            .ok_or(ReferentialError::AppointmentNotFound)?;

        if !state.contains_slot(&appointment.slot_id) {
            return Err(ReferentialError::SlotNotFound.into());
        }

        *per_slot_counts
            .entry(appointment.slot_id.clone())
            .or_insert(0) += 1;
    }

    for (slot_id, count) in per_slot_counts {
        let slot = state.slot(&slot_id).ok_or(ReferentialError::SlotNotFound)?;
        if count > usize::from(slot.capacity) {
            return Err(BusinessRuleError::CapacityExceeded.into());
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
    fn fails_when_appointments_exceed_slot_capacity() {
        let mut state = ScheduleState::new();
        let mut slot = make_slot("slot-1");
        slot.capacity = 1;
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
            result.expect_err("capacity exceed must fail"),
            SchedulerError::Business(BusinessRuleError::CapacityExceeded)
        );
    }
}
