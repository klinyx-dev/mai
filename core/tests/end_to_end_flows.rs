use chrono::{NaiveDate, TimeZone, Utc};
use mai::{
    ActorId, AddAppointmentCommand, AddSlotCommand, AppointmentId, CancelSlotCommand,
    SchedulerError, SchedulerService, SlotId, WeeklyLayoutQuery,
};

fn add_slot_command(
    slot_id: &str,
    assignee_id: &str,
    start_hour: u32,
    end_hour: u32,
) -> AddSlotCommand {
    AddSlotCommand {
        slot_id: SlotId::new(slot_id),
        start: Utc.with_ymd_and_hms(2026, 1, 5, start_hour, 0, 0).unwrap(),
        end: Utc.with_ymd_and_hms(2026, 1, 5, end_hour, 0, 0).unwrap(),
        assignee_id: ActorId::new(assignee_id),
        created_by: ActorId::new("creator-1"),
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
        .add_slot(add_slot_command("slot-1", "assignee-1", 9, 10))
        .unwrap();
    service
        .add_appointment(add_appointment_command("appt-1", "slot-1"))
        .unwrap();
    service
        .delete_appointment(mai::DeleteAppointmentCommand {
            appointment_id: AppointmentId::new("appt-1"),
        })
        .unwrap();

    let layout = service.get_weekly_layout(WeeklyLayoutQuery::new(
        NaiveDate::from_ymd_opt(2026, 1, 8).unwrap(),
    ));

    assert_eq!(layout.slots.len(), 1);
    assert!(layout.appointments.is_empty());
    assert_eq!(layout.slots[0].slot_id, SlotId::new("slot-1"));
}

#[test]
fn cancel_then_booking_is_rejected() {
    let mut service = SchedulerService::new();
    service
        .add_slot(add_slot_command("slot-1", "assignee-1", 9, 10))
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
fn overlapping_slots_same_assignee_are_rejected() {
    let mut service = SchedulerService::new();
    service
        .add_slot(add_slot_command("slot-1", "assignee-1", 9, 10))
        .unwrap();

    let error = service
        .add_slot(AddSlotCommand {
            slot_id: SlotId::new("slot-2"),
            start: Utc.with_ymd_and_hms(2026, 1, 5, 9, 30, 0).unwrap(),
            end: Utc.with_ymd_and_hms(2026, 1, 5, 10, 30, 0).unwrap(),
            assignee_id: ActorId::new("assignee-1"),
            created_by: ActorId::new("creator-1"),
        })
        .expect_err("same-assignee overlap must fail");

    assert_eq!(
        error,
        SchedulerError::Business(mai::BusinessRuleError::SlotOverlap)
    );
}

#[test]
fn overlapping_slots_different_assignees_are_allowed() {
    let mut service = SchedulerService::new();
    service
        .add_slot(add_slot_command("slot-1", "assignee-1", 9, 10))
        .unwrap();
    service
        .add_slot(add_slot_command("slot-2", "assignee-2", 9, 10))
        .unwrap();

    let layout = service.get_weekly_layout(WeeklyLayoutQuery::new(
        NaiveDate::from_ymd_opt(2026, 1, 8).unwrap(),
    ));

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
