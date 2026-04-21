use crate::application::ActorLookup;
use crate::application::command_result::CommandResult;
use crate::application::errors::{ReferentialError, StructuralError};
use crate::commands::add_appointment::AddAppointmentCommand;
use crate::commands::add_slot::AddSlotCommand;
use crate::commands::cancel_slot::CancelSlotCommand;
use crate::commands::delete_appointment::DeleteAppointmentCommand;
use crate::commands::delete_slot::DeleteSlotCommand;
use crate::domain::appointment::Appointment;
use crate::domain::enums::SlotStatus;
use crate::domain::slot::Slot;
use crate::domain::time_range::TimeRange;
use crate::layout::weekly_layout::{
    project_appointment_layout_nodes, project_slot_layout_nodes, week_range_from_anchor,
};
use crate::layout::{WeeklyLayout, WeeklyLayoutQuery};
use crate::state::schedule_state::ScheduleState;
use crate::validation::appointment_validation::{
    ensure_appointment_exists, ensure_no_appointment_for_slot, ensure_title_not_empty,
};
use crate::validation::invariants::validate_slot_appointment_invariants;
use crate::validation::slot_validation::{
    ensure_no_overlap_for_assignee, ensure_slot_exists, ensure_slot_is_available,
    ensure_slot_is_cancellable, ensure_slot_is_deletable,
};
use std::fmt;
use std::sync::Arc;

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

    pub fn add_slot(&mut self, cmd: AddSlotCommand) -> CommandResult {
        self.ensure_actor_exists(&cmd.assignee_id, ReferentialError::AssigneeNotFound)?;
        self.ensure_actor_exists(&cmd.created_by, ReferentialError::CreatorNotFound)?;

        let time =
            TimeRange::new(cmd.start, cmd.end).map_err(|_| StructuralError::InvalidTimeRange)?;
        let slot = Slot::new(cmd.slot_id.clone(), time, cmd.assignee_id, cmd.created_by);

        ensure_no_overlap_for_assignee(&self.state, &slot)?;
        self.state.slots.insert(cmd.slot_id, slot);
        validate_slot_appointment_invariants(&self.state)?;
        Ok(())
    }

    pub fn delete_slot(&mut self, cmd: DeleteSlotCommand) -> CommandResult {
        let slot = ensure_slot_exists(&self.state, &cmd.slot_id)?;
        ensure_slot_is_deletable(slot)?;

        self.state.slots.remove(&cmd.slot_id);
        validate_slot_appointment_invariants(&self.state)?;
        Ok(())
    }

    pub fn cancel_slot(&mut self, cmd: CancelSlotCommand) -> CommandResult {
        let slot = ensure_slot_exists(&self.state, &cmd.slot_id)?;
        ensure_slot_is_cancellable(slot)?;

        let slot = self
            .state
            .slots
            .get_mut(&cmd.slot_id)
            .ok_or(ReferentialError::SlotNotFound)?;
        slot.status = SlotStatus::Cancelled;

        validate_slot_appointment_invariants(&self.state)?;
        Ok(())
    }

    pub fn add_appointment(&mut self, cmd: AddAppointmentCommand) -> CommandResult {
        self.ensure_actor_exists(&cmd.created_by, ReferentialError::CreatorNotFound)?;

        ensure_title_not_empty(&cmd.title)?;
        let slot = ensure_slot_exists(&self.state, &cmd.slot_id)?;
        ensure_slot_is_available(slot)?;
        ensure_no_appointment_for_slot(&self.state, &cmd.slot_id)?;

        let appointment = Appointment::new(
            cmd.appointment_id.clone(),
            cmd.slot_id.clone(),
            cmd.invitee_ids,
            cmd.title,
            cmd.created_by,
        );

        self.state
            .appointments
            .insert(cmd.appointment_id, appointment);

        let slot = self
            .state
            .slots
            .get_mut(&cmd.slot_id)
            .ok_or(ReferentialError::SlotNotFound)?;
        slot.status = SlotStatus::Booked;

        validate_slot_appointment_invariants(&self.state)?;
        Ok(())
    }

    pub fn delete_appointment(&mut self, cmd: DeleteAppointmentCommand) -> CommandResult {
        let appointment = ensure_appointment_exists(&self.state, &cmd.appointment_id)?;

        let slot_id = appointment.slot_id.clone();

        ensure_slot_exists(&self.state, &slot_id)?;

        self.state.appointments.remove(&cmd.appointment_id);

        let slot = self
            .state
            .slots
            .get_mut(&slot_id)
            .ok_or(ReferentialError::SlotNotFound)?;
        slot.status = SlotStatus::Available;

        validate_slot_appointment_invariants(&self.state)?;
        Ok(())
    }

    pub fn get_weekly_layout(&self, query: WeeklyLayoutQuery) -> WeeklyLayout {
        let week = week_range_from_anchor(query.anchor_date);
        let slots = project_slot_layout_nodes(&self.state, &query);
        let appointments = project_appointment_layout_nodes(&self.state, &query);

        WeeklyLayout {
            week_start: week.start,
            week_end: week.end,
            slots,
            appointments,
        }
    }

    fn ensure_actor_exists(
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

#[cfg(test)]
mod tests {
    use super::SchedulerService;
    use crate::application::actor_lookup::ActorLookup;
    use crate::application::errors::{
        BusinessRuleError, ReferentialError, SchedulerError, StructuralError,
    };
    use crate::commands::add_appointment::AddAppointmentCommand;
    use crate::commands::add_slot::AddSlotCommand;
    use crate::commands::cancel_slot::CancelSlotCommand;
    use crate::commands::delete_appointment::DeleteAppointmentCommand;
    use crate::commands::delete_slot::DeleteSlotCommand;
    use crate::domain::enums::SlotStatus;
    use crate::domain::ids::{ActorId, AppointmentId, SlotId};
    use crate::layout::WeeklyLayoutQuery;
    use chrono::{TimeZone, Utc};
    use std::collections::HashSet;
    use std::sync::Arc;

    #[derive(Clone, Debug, Default)]
    struct TestActorLookup {
        existing: HashSet<ActorId>,
    }

    impl ActorLookup for TestActorLookup {
        fn actor_exists(&self, actor_id: &ActorId) -> bool {
            self.existing.contains(actor_id)
        }
    }

    fn actor_lookup(ids: &[&str]) -> Arc<dyn ActorLookup> {
        let existing = ids.iter().map(|id| ActorId::new(*id)).collect();
        Arc::new(TestActorLookup { existing })
    }

    fn add_slot_cmd(slot_id: &str) -> AddSlotCommand {
        AddSlotCommand {
            slot_id: SlotId::new(slot_id),
            start: Utc.with_ymd_and_hms(2026, 1, 5, 9, 0, 0).unwrap(),
            end: Utc.with_ymd_and_hms(2026, 1, 5, 10, 0, 0).unwrap(),
            assignee_id: ActorId::new("assignee-1"),
            created_by: ActorId::new("creator-1"),
        }
    }

    fn add_appointment_cmd(appointment_id: &str, slot_id: &str) -> AddAppointmentCommand {
        AddAppointmentCommand {
            appointment_id: AppointmentId::new(appointment_id),
            slot_id: SlotId::new(slot_id),
            invitee_ids: vec![ActorId::new("invitee-1")],
            title: "Consultation".to_string(),
            created_by: ActorId::new("creator-2"),
        }
    }

    #[test]
    fn booking_creates_exactly_one_appointment_and_marks_slot_booked() {
        let mut service = SchedulerService::new();
        service.add_slot(add_slot_cmd("slot-1")).unwrap();

        service
            .add_appointment(add_appointment_cmd("appt-1", "slot-1"))
            .unwrap();

        assert_eq!(service.state().appointments.len(), 1);
        assert_eq!(
            service
                .state()
                .slots
                .get(&SlotId::new("slot-1"))
                .expect("slot exists")
                .status,
            SlotStatus::Booked
        );
    }

    #[test]
    fn deleting_appointment_restores_slot_availability() {
        let mut service = SchedulerService::new();
        service.add_slot(add_slot_cmd("slot-1")).unwrap();
        service
            .add_appointment(add_appointment_cmd("appt-1", "slot-1"))
            .unwrap();

        service
            .delete_appointment(DeleteAppointmentCommand {
                appointment_id: AppointmentId::new("appt-1"),
            })
            .unwrap();

        assert!(service.state().appointments.is_empty());
        assert_eq!(
            service
                .state()
                .slots
                .get(&SlotId::new("slot-1"))
                .expect("slot exists")
                .status,
            SlotStatus::Available
        );
    }

    #[test]
    fn booked_slot_cannot_be_deleted() {
        let mut service = SchedulerService::new();
        service.add_slot(add_slot_cmd("slot-1")).unwrap();
        service
            .add_appointment(add_appointment_cmd("appt-1", "slot-1"))
            .unwrap();

        let result = service.delete_slot(DeleteSlotCommand {
            slot_id: SlotId::new("slot-1"),
        });

        assert_eq!(
            result.expect_err("booked slot deletion must fail"),
            SchedulerError::Business(BusinessRuleError::CannotDeleteBookedSlot)
        );
    }

    #[test]
    fn deleting_available_slot_removes_it_by_id() {
        let mut service = SchedulerService::new();
        service.add_slot(add_slot_cmd("slot-1")).unwrap();
        service
            .add_slot(AddSlotCommand {
                slot_id: SlotId::new("slot-2"),
                start: Utc.with_ymd_and_hms(2026, 1, 5, 10, 0, 0).unwrap(),
                end: Utc.with_ymd_and_hms(2026, 1, 5, 11, 0, 0).unwrap(),
                assignee_id: ActorId::new("assignee-1"),
                created_by: ActorId::new("creator-1"),
            })
            .unwrap();

        service
            .delete_slot(DeleteSlotCommand {
                slot_id: SlotId::new("slot-1"),
            })
            .unwrap();

        assert!(!service.state().slots.contains_key(&SlotId::new("slot-1")));
        assert!(service.state().slots.contains_key(&SlotId::new("slot-2")));
    }

    #[test]
    fn cannot_book_cancelled_slot() {
        let mut service = SchedulerService::new();
        service.add_slot(add_slot_cmd("slot-1")).unwrap();
        service
            .cancel_slot(CancelSlotCommand {
                slot_id: SlotId::new("slot-1"),
            })
            .unwrap();

        let result = service.add_appointment(add_appointment_cmd("appt-1", "slot-1"));

        assert_eq!(
            result.expect_err("booking cancelled slot must fail"),
            SchedulerError::Business(BusinessRuleError::SlotCancelled)
        );
        assert!(service.state().appointments.is_empty());
    }

    #[test]
    fn delete_appointment_fails_when_not_found() {
        let mut service = SchedulerService::new();
        let result = service.delete_appointment(DeleteAppointmentCommand {
            appointment_id: AppointmentId::new("missing"),
        });

        assert_eq!(
            result.expect_err("missing appointment must fail"),
            SchedulerError::Referential(ReferentialError::AppointmentNotFound)
        );
    }

    #[test]
    fn rejects_overlapping_slots_for_same_assignee() {
        let mut service = SchedulerService::new();

        service.add_slot(add_slot_cmd("slot-1")).unwrap();
        let result = service.add_slot(AddSlotCommand {
            slot_id: SlotId::new("slot-2"),
            start: Utc.with_ymd_and_hms(2026, 1, 5, 9, 30, 0).unwrap(),
            end: Utc.with_ymd_and_hms(2026, 1, 5, 10, 30, 0).unwrap(),
            assignee_id: ActorId::new("assignee-1"),
            created_by: ActorId::new("creator-2"),
        });

        assert_eq!(
            result.expect_err("overlapping slot should fail"),
            SchedulerError::Business(BusinessRuleError::SlotOverlap)
        );
    }

    #[test]
    fn rejects_blank_appointment_title() {
        let mut service = SchedulerService::new();
        service.add_slot(add_slot_cmd("slot-1")).unwrap();

        let result = service.add_appointment(AddAppointmentCommand {
            appointment_id: AppointmentId::new("appt-1"),
            slot_id: SlotId::new("slot-1"),
            invitee_ids: vec![ActorId::new("invitee-1")],
            title: "   ".to_string(),
            created_by: ActorId::new("creator-1"),
        });

        assert_eq!(
            result.expect_err("blank title must fail"),
            SchedulerError::Structural(StructuralError::EmptyTitle)
        );
    }

    #[test]
    fn get_weekly_layout_returns_projected_nodes() {
        let mut service = SchedulerService::new();
        service.add_slot(add_slot_cmd("slot-1")).unwrap();
        service
            .add_appointment(add_appointment_cmd("appt-1", "slot-1"))
            .unwrap();

        let layout = service.get_weekly_layout(WeeklyLayoutQuery {
            anchor_date: chrono::NaiveDate::from_ymd_opt(2026, 1, 8).unwrap(),
        });

        assert_eq!(
            layout.week_start,
            chrono::NaiveDate::from_ymd_opt(2026, 1, 5).unwrap()
        );
        assert_eq!(
            layout.week_end,
            chrono::NaiveDate::from_ymd_opt(2026, 1, 12).unwrap()
        );
        assert!(layout.slots.is_empty());
        assert_eq!(layout.appointments.len(), 1);
        assert_eq!(
            layout.appointments[0].appointment_id,
            AppointmentId::new("appt-1")
        );
    }

    #[test]
    fn add_slot_rejects_missing_assignee_when_lookup_is_enabled() {
        let mut service = SchedulerService::with_actor_lookup(actor_lookup(&["creator-1"]));

        let result = service.add_slot(add_slot_cmd("slot-1"));

        assert_eq!(
            result.expect_err("missing assignee should fail"),
            SchedulerError::Referential(ReferentialError::AssigneeNotFound)
        );
    }

    #[test]
    fn add_slot_rejects_missing_creator_when_lookup_is_enabled() {
        let mut service = SchedulerService::with_actor_lookup(actor_lookup(&["assignee-1"]));

        let result = service.add_slot(add_slot_cmd("slot-1"));

        assert_eq!(
            result.expect_err("missing creator should fail"),
            SchedulerError::Referential(ReferentialError::CreatorNotFound)
        );
    }

    #[test]
    fn add_appointment_rejects_missing_creator_when_lookup_is_enabled() {
        let mut service =
            SchedulerService::with_actor_lookup(actor_lookup(&["assignee-1", "creator-1"]));
        service.add_slot(add_slot_cmd("slot-1")).unwrap();

        let result = service.add_appointment(add_appointment_cmd("appt-1", "slot-1"));

        assert_eq!(
            result.expect_err("missing appointment creator should fail"),
            SchedulerError::Referential(ReferentialError::CreatorNotFound)
        );
    }

    #[test]
    fn actor_validation_is_skipped_when_lookup_is_not_configured() {
        let mut service = SchedulerService::new();

        let result = service.add_slot(AddSlotCommand {
            slot_id: SlotId::new("slot-unknown-actors"),
            start: Utc.with_ymd_and_hms(2026, 1, 5, 13, 0, 0).unwrap(),
            end: Utc.with_ymd_and_hms(2026, 1, 5, 14, 0, 0).unwrap(),
            assignee_id: ActorId::new("missing-assignee"),
            created_by: ActorId::new("missing-creator"),
        });

        assert!(
            result.is_ok(),
            "behavior should remain unchanged without lookup"
        );
    }
}
