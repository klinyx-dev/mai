use super::SchedulerService;
use crate::application::actor_lookup::ActorLookup;
use crate::application::errors::{
    BusinessRuleError, ReferentialError, SchedulerError, StructuralError,
};
use crate::commands::add_appointment::AddAppointmentCommand;
use crate::commands::add_slot::AddSlotCommand;
use crate::commands::cancel_appointment::CancelAppointmentCommand;
use crate::commands::cancel_slot::CancelSlotCommand;
use crate::commands::delete_appointment::DeleteAppointmentCommand;
use crate::commands::delete_slot::DeleteSlotCommand;
use crate::commands::reschedule_slot::RescheduleSlotCommand;
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
        resource_owner_id: ActorId::new("owner-1"),
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
fn duplicate_slot_id_is_rejected_and_state_is_unchanged() {
    let mut service = SchedulerService::new();
    service.add_slot(add_slot_cmd("slot-1")).unwrap();

    let result = service.add_slot(add_slot_cmd("slot-1"));

    assert_eq!(
        result.expect_err("duplicate slot id must fail"),
        SchedulerError::Business(BusinessRuleError::SlotIdAlreadyExists)
    );
    assert_eq!(service.state().slots.len(), 1);
    assert_eq!(
        service
            .state()
            .slots
            .get(&SlotId::new("slot-1"))
            .expect("slot exists")
            .time
            .start,
        Utc.with_ymd_and_hms(2026, 1, 5, 9, 0, 0).unwrap()
    );
}

#[test]
fn duplicate_appointment_id_is_rejected_and_state_is_unchanged() {
    let mut service = SchedulerService::new();
    service.add_slot(add_slot_cmd("slot-1")).unwrap();
    service
        .add_appointment(add_appointment_cmd("appt-1", "slot-1"))
        .unwrap();

    let result = service.add_appointment(AddAppointmentCommand {
        appointment_id: AppointmentId::new("appt-1"),
        slot_id: SlotId::new("slot-1"),
        invitee_ids: vec![ActorId::new("invitee-2")],
        title: "Follow-up".to_string(),
        created_by: ActorId::new("creator-2"),
    });

    assert_eq!(
        result.expect_err("duplicate appointment id must fail"),
        SchedulerError::Business(BusinessRuleError::AppointmentIdAlreadyExists)
    );
    assert_eq!(service.state().appointments.len(), 1);
    assert_eq!(
        service
            .state()
            .appointments
            .get(&AppointmentId::new("appt-1"))
            .expect("appointment exists")
            .title,
        "Consultation"
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
fn cancellation_by_resource_owner_invitee_or_creator_restores_slot_availability() {
    for canceller in ["owner-1", "invitee-1", "creator-2"] {
        let mut service = SchedulerService::new();
        service.add_slot(add_slot_cmd("slot-1")).unwrap();
        service
            .add_appointment(add_appointment_cmd("appt-1", "slot-1"))
            .unwrap();

        service
            .cancel_appointment(CancelAppointmentCommand {
                appointment_id: AppointmentId::new("appt-1"),
                cancelled_by: ActorId::new(canceller),
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
}

#[test]
fn cancellation_by_non_participant_is_rejected() {
    let mut service = SchedulerService::new();
    service.add_slot(add_slot_cmd("slot-1")).unwrap();
    service
        .add_appointment(add_appointment_cmd("appt-1", "slot-1"))
        .unwrap();

    let result = service.cancel_appointment(CancelAppointmentCommand {
        appointment_id: AppointmentId::new("appt-1"),
        cancelled_by: ActorId::new("someone-else"),
    });

    assert_eq!(
        result.expect_err("non participant canceller must fail"),
        SchedulerError::Business(BusinessRuleError::AppointmentCancelNotAllowed)
    );
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
    assert!(service.state().slots.contains_key(&SlotId::new("slot-1")));
    assert!(
        service
            .state()
            .appointments
            .contains_key(&AppointmentId::new("appt-1"))
    );
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
fn deleting_available_slot_removes_it_by_id() {
    let mut service = SchedulerService::new();
    service.add_slot(add_slot_cmd("slot-1")).unwrap();
    service
        .add_slot(AddSlotCommand {
            slot_id: SlotId::new("slot-2"),
            start: Utc.with_ymd_and_hms(2026, 1, 5, 10, 0, 0).unwrap(),
            end: Utc.with_ymd_and_hms(2026, 1, 5, 11, 0, 0).unwrap(),
            resource_owner_id: ActorId::new("owner-1"),
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
fn rescheduling_available_slot_updates_time_range() {
    let mut service = SchedulerService::new();
    service.add_slot(add_slot_cmd("slot-1")).unwrap();

    service
        .reschedule_slot(RescheduleSlotCommand {
            slot_id: SlotId::new("slot-1"),
            new_start: Utc.with_ymd_and_hms(2026, 1, 5, 11, 0, 0).unwrap(),
            new_end: Utc.with_ymd_and_hms(2026, 1, 5, 12, 0, 0).unwrap(),
            updated_by: ActorId::new("creator-1"),
        })
        .unwrap();

    let slot = service
        .state()
        .slots
        .get(&SlotId::new("slot-1"))
        .expect("slot exists");
    assert_eq!(
        slot.time.start,
        Utc.with_ymd_and_hms(2026, 1, 5, 11, 0, 0).unwrap()
    );
    assert_eq!(
        slot.time.end,
        Utc.with_ymd_and_hms(2026, 1, 5, 12, 0, 0).unwrap()
    );
}

#[test]
fn rescheduling_slot_rejects_overlap_for_same_resource_owner() {
    let mut service = SchedulerService::new();
    service.add_slot(add_slot_cmd("slot-1")).unwrap();
    service
        .add_slot(AddSlotCommand {
            slot_id: SlotId::new("slot-2"),
            start: Utc.with_ymd_and_hms(2026, 1, 5, 10, 0, 0).unwrap(),
            end: Utc.with_ymd_and_hms(2026, 1, 5, 11, 0, 0).unwrap(),
            resource_owner_id: ActorId::new("owner-1"),
            created_by: ActorId::new("creator-1"),
        })
        .unwrap();

    let result = service.reschedule_slot(RescheduleSlotCommand {
        slot_id: SlotId::new("slot-1"),
        new_start: Utc.with_ymd_and_hms(2026, 1, 5, 10, 30, 0).unwrap(),
        new_end: Utc.with_ymd_and_hms(2026, 1, 5, 11, 30, 0).unwrap(),
        updated_by: ActorId::new("creator-1"),
    });

    assert_eq!(
        result.expect_err("overlapping reschedule should fail"),
        SchedulerError::Business(BusinessRuleError::SlotOverlap)
    );
    let slot = service
        .state()
        .slots
        .get(&SlotId::new("slot-1"))
        .expect("slot exists");
    assert_eq!(
        slot.time.start,
        Utc.with_ymd_and_hms(2026, 1, 5, 9, 0, 0).unwrap()
    );
    assert_eq!(
        slot.time.end,
        Utc.with_ymd_and_hms(2026, 1, 5, 10, 0, 0).unwrap()
    );
}

#[test]
fn rescheduling_booked_slot_is_rejected() {
    let mut service = SchedulerService::new();
    service.add_slot(add_slot_cmd("slot-1")).unwrap();
    service
        .add_appointment(add_appointment_cmd("appt-1", "slot-1"))
        .unwrap();

    let result = service.reschedule_slot(RescheduleSlotCommand {
        slot_id: SlotId::new("slot-1"),
        new_start: Utc.with_ymd_and_hms(2026, 1, 5, 11, 0, 0).unwrap(),
        new_end: Utc.with_ymd_and_hms(2026, 1, 5, 12, 0, 0).unwrap(),
        updated_by: ActorId::new("creator-1"),
    });

    assert_eq!(
        result.expect_err("booked slot reschedule should fail"),
        SchedulerError::Business(BusinessRuleError::SlotNotAvailable)
    );
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
fn appointment_host_is_derived_from_slot_resource_owner() {
    let mut service = SchedulerService::new();
    service.add_slot(add_slot_cmd("slot-1")).unwrap();

    service
        .add_appointment(add_appointment_cmd("appt-1", "slot-1"))
        .unwrap();

    let appointment = service
        .state()
        .appointments
        .get(&AppointmentId::new("appt-1"))
        .expect("appointment exists");
    let slot = service
        .state()
        .slots
        .get(&appointment.slot_id)
        .expect("referenced slot exists");

    let derived_host = slot.resource_owner_id.clone();
    assert_eq!(derived_host, ActorId::new("owner-1"));
    assert_ne!(appointment.created_by, derived_host);
}

#[test]
fn cancelling_booked_slot_is_rejected() {
    let mut service = SchedulerService::new();
    service.add_slot(add_slot_cmd("slot-1")).unwrap();
    service
        .add_appointment(add_appointment_cmd("appt-1", "slot-1"))
        .unwrap();

    let result = service.cancel_slot(CancelSlotCommand {
        slot_id: SlotId::new("slot-1"),
    });

    assert_eq!(
        result.expect_err("cancelling booked slot must fail"),
        SchedulerError::Business(BusinessRuleError::SlotNotAvailable)
    );
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
fn rejects_overlapping_slots_for_same_resource_owner() {
    let mut service = SchedulerService::new();

    service.add_slot(add_slot_cmd("slot-1")).unwrap();
    let result = service.add_slot(AddSlotCommand {
        slot_id: SlotId::new("slot-2"),
        start: Utc.with_ymd_and_hms(2026, 1, 5, 9, 30, 0).unwrap(),
        end: Utc.with_ymd_and_hms(2026, 1, 5, 10, 30, 0).unwrap(),
        resource_owner_id: ActorId::new("owner-1"),
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

    let layout = service
        .get_weekly_layout_checked(WeeklyLayoutQuery::new(
            chrono::NaiveDate::from_ymd_opt(2026, 1, 8).unwrap(),
        ))
        .expect("valid query should succeed");

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
fn add_slot_rejects_missing_resource_owner_when_lookup_is_enabled() {
    let mut service = SchedulerService::with_actor_lookup(actor_lookup(&["creator-1"]));

    let result = service.add_slot(add_slot_cmd("slot-1"));

    assert_eq!(
        result.expect_err("missing resource owner should fail"),
        SchedulerError::Referential(ReferentialError::ResourceOwnerNotFound)
    );
}

#[test]
fn add_slot_rejects_missing_creator_when_lookup_is_enabled() {
    let mut service = SchedulerService::with_actor_lookup(actor_lookup(&["owner-1"]));

    let result = service.add_slot(add_slot_cmd("slot-1"));

    assert_eq!(
        result.expect_err("missing creator should fail"),
        SchedulerError::Referential(ReferentialError::CreatorNotFound)
    );
}

#[test]
fn add_appointment_rejects_missing_creator_when_lookup_is_enabled() {
    let mut service = SchedulerService::with_actor_lookup(actor_lookup(&["owner-1", "creator-1"]));
    service.add_slot(add_slot_cmd("slot-1")).unwrap();

    let result = service.add_appointment(add_appointment_cmd("appt-1", "slot-1"));

    assert_eq!(
        result.expect_err("missing appointment creator should fail"),
        SchedulerError::Referential(ReferentialError::CreatorNotFound)
    );
}

#[test]
fn reschedule_slot_rejects_missing_updater_when_lookup_is_enabled() {
    let mut service = SchedulerService::with_actor_lookup(actor_lookup(&["owner-1", "creator-1"]));
    service.add_slot(add_slot_cmd("slot-1")).unwrap();

    let result = service.reschedule_slot(RescheduleSlotCommand {
        slot_id: SlotId::new("slot-1"),
        new_start: Utc.with_ymd_and_hms(2026, 1, 5, 11, 0, 0).unwrap(),
        new_end: Utc.with_ymd_and_hms(2026, 1, 5, 12, 0, 0).unwrap(),
        updated_by: ActorId::new("missing-updater"),
    });

    assert_eq!(
        result.expect_err("missing updater should fail"),
        SchedulerError::Referential(ReferentialError::UpdaterNotFound)
    );
}

#[test]
fn add_appointment_rejects_missing_invitee_when_lookup_is_enabled() {
    let mut service =
        SchedulerService::with_actor_lookup(actor_lookup(&["owner-1", "creator-1", "creator-2"]));
    service.add_slot(add_slot_cmd("slot-1")).unwrap();

    let result = service.add_appointment(add_appointment_cmd("appt-1", "slot-1"));

    assert_eq!(
        result.expect_err("missing invitee should fail"),
        SchedulerError::Referential(ReferentialError::InviteeNotFound)
    );
}

#[test]
fn cancel_appointment_rejects_missing_canceller_when_lookup_is_enabled() {
    let mut service = SchedulerService::with_actor_lookup(actor_lookup(&[
        "owner-1",
        "creator-1",
        "creator-2",
        "invitee-1",
    ]));
    service.add_slot(add_slot_cmd("slot-1")).unwrap();
    service
        .add_appointment(add_appointment_cmd("appt-1", "slot-1"))
        .unwrap();

    let result = service.cancel_appointment(CancelAppointmentCommand {
        appointment_id: AppointmentId::new("appt-1"),
        cancelled_by: ActorId::new("missing-canceller"),
    });

    assert_eq!(
        result.expect_err("missing canceller should fail"),
        SchedulerError::Referential(ReferentialError::CancellerNotFound)
    );
}

#[test]
fn actor_validation_is_skipped_when_lookup_is_not_configured() {
    let mut service = SchedulerService::new();

    let result = service.add_slot(AddSlotCommand {
        slot_id: SlotId::new("slot-unknown-actors"),
        start: Utc.with_ymd_and_hms(2026, 1, 5, 13, 0, 0).unwrap(),
        end: Utc.with_ymd_and_hms(2026, 1, 5, 14, 0, 0).unwrap(),
        resource_owner_id: ActorId::new("missing-owner"),
        created_by: ActorId::new("missing-creator"),
    });

    assert!(
        result.is_ok(),
        "behavior should remain unchanged without lookup"
    );
}

#[test]
fn weekly_layout_query_rejects_invalid_visible_window_order() {
    let service = SchedulerService::new();
    let mut query = WeeklyLayoutQuery::new(chrono::NaiveDate::from_ymd_opt(2026, 1, 8).unwrap());
    query.visible_start_minute = Some(600);
    query.visible_end_minute = Some(600);

    let result = service.get_weekly_layout_checked(query);

    assert_eq!(
        result.expect_err("equal visible window bounds must fail"),
        SchedulerError::Structural(StructuralError::InvalidVisibleWindow)
    );
}

#[test]
fn weekly_layout_query_rejects_out_of_range_visible_window_bound() {
    let service = SchedulerService::new();
    let mut query = WeeklyLayoutQuery::new(chrono::NaiveDate::from_ymd_opt(2026, 1, 8).unwrap());
    query.visible_end_minute = Some(1441);

    let result = service.get_weekly_layout_checked(query);

    assert_eq!(
        result.expect_err("out of range visible window bound must fail"),
        SchedulerError::Structural(StructuralError::InvalidVisibleWindow)
    );
}
