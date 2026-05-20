use chrono::{NaiveDate, TimeZone, Utc};
use mai::{
    ActorId, AddAppointmentCommand, AddSlotCommand, AppointmentId, CalendarOwnerFilter,
    CancelAppointmentCommand, CancelSlotCommand, SchedulerError, SchedulerService, SlotId,
    WeeklyLayoutQuery,
};

fn add_slot_command(
    slot_id: &str,
    resource_owner_id: &str,
    start_hour: u32,
    end_hour: u32,
) -> AddSlotCommand {
    AddSlotCommand {
        slot_id: SlotId::new(slot_id),
        start: Utc.with_ymd_and_hms(2026, 1, 5, start_hour, 0, 0).unwrap(),
        end: Utc.with_ymd_and_hms(2026, 1, 5, end_hour, 0, 0).unwrap(),
        resource_owner_id: ActorId::new(resource_owner_id),
        created_by: ActorId::new("creator-1"),
        capacity: 1,
    }
}

fn add_appointment_command(appointment_id: &str, slot_id: &str) -> AddAppointmentCommand {
    AddAppointmentCommand {
        appointment_id: AppointmentId::new(appointment_id),
        slot_id: SlotId::new(slot_id),
        invitee_ids: vec![ActorId::new("invitee-1")],
        title: "Consultation".to_string(),
        created_by: ActorId::new("creator-2"),
    }
}

#[test]
fn add_slot_book_unbook_and_layout_flow() {
    let mut service = SchedulerService::new();
    service
        .add_slot(add_slot_command("slot-1", "owner-1", 9, 10))
        .unwrap();
    service
        .add_appointment(add_appointment_command("appt-1", "slot-1"))
        .unwrap();
    service
        .delete_appointment(mai::DeleteAppointmentCommand {
            appointment_id: AppointmentId::new("appt-1"),
        })
        .unwrap();

    let layout = service
        .get_weekly_layout_checked(WeeklyLayoutQuery::new(
            NaiveDate::from_ymd_opt(2026, 1, 8).unwrap(),
        ))
        .expect("valid query should succeed");

    assert_eq!(layout.slots.len(), 1);
    assert!(layout.appointments.is_empty());
    assert_eq!(layout.slots[0].slot_id, SlotId::new("slot-1"));
}

#[test]
fn participant_can_cancel_appointment_and_unbook_slot() {
    let mut service = SchedulerService::new();
    service
        .add_slot(add_slot_command("slot-1", "owner-1", 9, 10))
        .unwrap();
    service
        .add_appointment(add_appointment_command("appt-1", "slot-1"))
        .unwrap();
    service
        .cancel_appointment(CancelAppointmentCommand {
            appointment_id: AppointmentId::new("appt-1"),
            cancelled_by: ActorId::new("invitee-1"),
        })
        .unwrap();

    let layout = service
        .get_weekly_layout_checked(WeeklyLayoutQuery::new(
            NaiveDate::from_ymd_opt(2026, 1, 8).unwrap(),
        ))
        .expect("valid query should succeed");

    assert_eq!(layout.slots.len(), 1);
    assert!(layout.appointments.is_empty());
    assert_eq!(layout.slots[0].slot_id, SlotId::new("slot-1"));
}

#[test]
fn cancel_then_booking_is_rejected() {
    let mut service = SchedulerService::new();
    service
        .add_slot(add_slot_command("slot-1", "owner-1", 9, 10))
        .unwrap();
    service
        .cancel_slot(CancelSlotCommand {
            slot_id: SlotId::new("slot-1"),
        })
        .unwrap();

    let error = service
        .add_appointment(add_appointment_command("appt-1", "slot-1"))
        .expect_err("booking cancelled slot must fail");

    assert_eq!(
        error,
        SchedulerError::Business(mai::BusinessRuleError::SlotCancelled)
    );
}

#[test]
fn overlapping_slots_same_resource_owner_are_rejected() {
    let mut service = SchedulerService::new();
    service
        .add_slot(add_slot_command("slot-1", "owner-1", 9, 10))
        .unwrap();

    let error = service
        .add_slot(AddSlotCommand {
            slot_id: SlotId::new("slot-2"),
            start: Utc.with_ymd_and_hms(2026, 1, 5, 9, 30, 0).unwrap(),
            end: Utc.with_ymd_and_hms(2026, 1, 5, 10, 30, 0).unwrap(),
            resource_owner_id: ActorId::new("owner-1"),
            created_by: ActorId::new("creator-1"),
            capacity: 1,
        })
        .expect_err("same-resource-owner overlap must fail");

    assert_eq!(
        error,
        SchedulerError::Business(mai::BusinessRuleError::SlotOverlap)
    );
}

#[test]
fn overlapping_slots_different_resource_owners_are_allowed() {
    let mut service = SchedulerService::new();
    service
        .add_slot(add_slot_command("slot-1", "owner-1", 9, 10))
        .unwrap();
    service
        .add_slot(add_slot_command("slot-2", "owner-2", 9, 10))
        .unwrap();

    let layout = service
        .get_weekly_layout_checked(WeeklyLayoutQuery::new(
            NaiveDate::from_ymd_opt(2026, 1, 8).unwrap(),
        ))
        .expect("valid query should succeed");

    assert_eq!(layout.slots.len(), 2);
    assert!(
        layout
            .slots
            .iter()
            .any(|node| node.slot_id == SlotId::new("slot-1"))
    );
    assert!(
        layout
            .slots
            .iter()
            .any(|node| node.slot_id == SlotId::new("slot-2"))
    );
}

#[test]
fn duplicate_slot_id_is_rejected_and_keeps_original_slot() {
    let mut service = SchedulerService::new();
    service
        .add_slot(add_slot_command("slot-1", "owner-1", 9, 10))
        .unwrap();
    let error = service
        .add_slot(add_slot_command("slot-1", "owner-1", 11, 12))
        .expect_err("duplicate slot id must fail");

    assert_eq!(
        error,
        SchedulerError::Business(mai::BusinessRuleError::SlotIdAlreadyExists)
    );

    let layout = service
        .get_weekly_layout_checked(WeeklyLayoutQuery::new(
            NaiveDate::from_ymd_opt(2026, 1, 8).unwrap(),
        ))
        .expect("valid query should succeed");

    assert_eq!(layout.slots.len(), 1);
    assert_eq!(layout.slots[0].slot_id, SlotId::new("slot-1"));
    assert_eq!(layout.slots[0].start_minute, 9 * 60);
    assert_eq!(layout.slots[0].end_minute, 10 * 60);
}

#[test]
fn duplicate_appointment_id_is_rejected_and_keeps_original_appointment() {
    let mut service = SchedulerService::new();
    service
        .add_slot(add_slot_command("slot-1", "owner-1", 9, 10))
        .unwrap();
    service
        .add_slot(add_slot_command("slot-2", "owner-1", 11, 12))
        .unwrap();

    service
        .add_appointment(add_appointment_command("appt-1", "slot-1"))
        .unwrap();
    let error = service
        .add_appointment(add_appointment_command("appt-1", "slot-2"))
        .expect_err("duplicate appointment id must fail");

    assert_eq!(
        error,
        SchedulerError::Business(mai::BusinessRuleError::AppointmentIdAlreadyExists)
    );

    let layout = service
        .get_weekly_layout_checked(WeeklyLayoutQuery::new(
            NaiveDate::from_ymd_opt(2026, 1, 8).unwrap(),
        ))
        .expect("valid query should succeed");

    assert_eq!(layout.appointments.len(), 1);
    assert_eq!(
        layout.appointments[0].appointment_id,
        AppointmentId::new("appt-1")
    );
    assert_eq!(layout.appointments[0].slot_id, SlotId::new("slot-1"));
}

#[test]
fn weekly_layout_owner_filter_modes_are_deterministic() {
    let mut service = SchedulerService::new();
    service
        .add_slot(add_slot_command("slot-1", "owner-1", 9, 10))
        .unwrap();
    service
        .add_slot(add_slot_command("slot-2", "owner-2", 10, 11))
        .unwrap();
    service
        .add_appointment(add_appointment_command("appt-1", "slot-1"))
        .unwrap();

    let mut all_query = WeeklyLayoutQuery::new(NaiveDate::from_ymd_opt(2026, 1, 8).unwrap());
    all_query.owner_filter = CalendarOwnerFilter::All;
    let all_layout = service.get_weekly_layout_checked(all_query).unwrap();
    assert_eq!(all_layout.slots.len(), 1);
    assert_eq!(all_layout.appointments.len(), 1);

    let mut none_query = WeeklyLayoutQuery::new(NaiveDate::from_ymd_opt(2026, 1, 8).unwrap());
    none_query.owner_filter = CalendarOwnerFilter::None;
    let none_layout = service.get_weekly_layout_checked(none_query).unwrap();
    assert!(none_layout.slots.is_empty());
    assert!(none_layout.appointments.is_empty());

    let mut owners_query = WeeklyLayoutQuery::new(NaiveDate::from_ymd_opt(2026, 1, 8).unwrap());
    owners_query.owner_filter = CalendarOwnerFilter::Owners(vec![ActorId::new("owner-2")]);
    let owners_layout = service.get_weekly_layout_checked(owners_query).unwrap();
    assert_eq!(owners_layout.slots.len(), 1);
    assert_eq!(owners_layout.slots[0].slot_id, SlotId::new("slot-2"));
    assert!(owners_layout.appointments.is_empty());
}

#[test]
fn weekly_layout_visible_window_clips_and_filters_nodes() {
    let mut service = SchedulerService::new();
    service
        .add_slot(add_slot_command("slot-1", "owner-1", 9, 10))
        .unwrap();
    service
        .add_slot(add_slot_command("slot-2", "owner-1", 11, 12))
        .unwrap();

    let mut query = WeeklyLayoutQuery::new(NaiveDate::from_ymd_opt(2026, 1, 8).unwrap());
    query.visible_start_minute = Some(9 * 60 + 30);
    query.visible_end_minute = Some(11 * 60 + 30);

    let layout = service.get_weekly_layout_checked(query).unwrap();

    assert_eq!(layout.slots.len(), 2);
    assert_eq!(layout.slots[0].slot_id, SlotId::new("slot-1"));
    assert_eq!(layout.slots[0].start_minute, 9 * 60 + 30);
    assert_eq!(layout.slots[0].end_minute, 10 * 60);
    assert!(layout.slots[0].clipped_start);
    assert!(!layout.slots[0].clipped_end);

    assert_eq!(layout.slots[1].slot_id, SlotId::new("slot-2"));
    assert_eq!(layout.slots[1].start_minute, 11 * 60);
    assert_eq!(layout.slots[1].end_minute, 11 * 60 + 30);
    assert!(!layout.slots[1].clipped_start);
    assert!(layout.slots[1].clipped_end);
}
