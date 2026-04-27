use crate::application::errors::{BusinessRuleError, ReferentialError, StructuralError};
use crate::domain::appointment::Appointment;
use crate::domain::ids::{ActorId, AppointmentId, SlotId};
use crate::domain::slot::Slot;
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

pub fn ensure_actor_can_cancel_appointment(
    appointment: &Appointment,
    slot: &Slot,
    actor_id: &ActorId,
) -> Result<(), BusinessRuleError> {
    let is_slot_resource_owner = &slot.resource_owner_id == actor_id;
    let is_appointment_creator = &appointment.created_by == actor_id;
    let is_invitee = appointment
        .invitee_ids
        .iter()
        .any(|invitee| invitee == actor_id);

    if is_slot_resource_owner || is_appointment_creator || is_invitee {
        return Ok(());
    }

    Err(BusinessRuleError::AppointmentCancelNotAllowed)
}

#[cfg(test)]
mod tests {
    use super::{
        ensure_actor_can_cancel_appointment, ensure_no_appointment_for_slot, ensure_title_not_empty,
    };
    use crate::application::errors::BusinessRuleError;
    use crate::domain::appointment::Appointment;
    use crate::domain::ids::{ActorId, AppointmentId, SlotId};
    use crate::domain::slot::Slot;
    use crate::domain::time_range::TimeRange;
    use crate::state::schedule_state::ScheduleState;
    use chrono::{TimeZone, Utc};

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

    #[test]
    fn allows_cancellation_for_resource_owner_invitee_or_creator() {
        let appointment = Appointment::new(
            AppointmentId::new("appt-1"),
            SlotId::new("slot-1"),
            vec![ActorId::new("invitee-1")],
            "Consultation",
            ActorId::new("creator-1"),
        );
        let slot = Slot::new(
            SlotId::new("slot-1"),
            TimeRange::new(
                Utc.with_ymd_and_hms(2026, 1, 5, 9, 0, 0).unwrap(),
                Utc.with_ymd_and_hms(2026, 1, 5, 10, 0, 0).unwrap(),
            )
            .unwrap(),
            ActorId::new("owner-1"),
            ActorId::new("creator-2"),
        );

        assert!(
            ensure_actor_can_cancel_appointment(&appointment, &slot, &ActorId::new("owner-1"))
                .is_ok()
        );
        assert!(
            ensure_actor_can_cancel_appointment(&appointment, &slot, &ActorId::new("invitee-1"))
                .is_ok()
        );
        assert!(
            ensure_actor_can_cancel_appointment(&appointment, &slot, &ActorId::new("creator-1"))
                .is_ok()
        );
    }

    #[test]
    fn rejects_cancellation_for_non_participant_actor() {
        let appointment = Appointment::new(
            AppointmentId::new("appt-1"),
            SlotId::new("slot-1"),
            vec![ActorId::new("invitee-1")],
            "Consultation",
            ActorId::new("creator-1"),
        );
        let slot = Slot::new(
            SlotId::new("slot-1"),
            TimeRange::new(
                Utc.with_ymd_and_hms(2026, 1, 5, 9, 0, 0).unwrap(),
                Utc.with_ymd_and_hms(2026, 1, 5, 10, 0, 0).unwrap(),
            )
            .unwrap(),
            ActorId::new("owner-1"),
            ActorId::new("creator-2"),
        );

        let result =
            ensure_actor_can_cancel_appointment(&appointment, &slot, &ActorId::new("someone-else"));
        assert_eq!(result, Err(BusinessRuleError::AppointmentCancelNotAllowed));
    }
}
