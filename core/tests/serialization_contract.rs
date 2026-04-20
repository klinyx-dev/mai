use chrono::{NaiveDate, TimeZone, Utc};
use mai::{
    AddAppointmentCommand, AddSlotCommand, BusinessRuleError, SchedulerError, WeeklyLayoutQuery,
};

#[test]
fn add_slot_command_serializes_as_adapter_friendly_json() {
    let command = AddSlotCommand {
        slot_id: "slot-1001".into(),
        start: Utc.with_ymd_and_hms(2026, 5, 4, 9, 0, 0).unwrap(),
        end: Utc.with_ymd_and_hms(2026, 5, 4, 9, 30, 0).unwrap(),
        assignee_id: "doctor-42".into(),
        created_by: "admin-7".into(),
    };

    let json = serde_json::to_value(&command).unwrap();

    assert_eq!(json["slot_id"], "slot-1001");
    assert_eq!(json["start"], "2026-05-04T09:00:00Z");
    assert_eq!(json["end"], "2026-05-04T09:30:00Z");
    assert_eq!(json["assignee_id"], "doctor-42");
    assert_eq!(json["created_by"], "admin-7");
}

#[test]
fn add_appointment_command_round_trips() {
    let command = AddAppointmentCommand {
        appointment_id: "appt-9001".into(),
        slot_id: "slot-1001".into(),
        invitee_ids: vec!["patient-77".into()],
        title: "Follow-up Consultation".to_string(),
        created_by: "staff-3".into(),
    };

    let json = serde_json::to_string(&command).unwrap();
    let restored: AddAppointmentCommand = serde_json::from_str(&json).unwrap();

    assert_eq!(restored, command);
}

#[test]
fn weekly_layout_query_round_trips_with_iso_date() {
    let query = WeeklyLayoutQuery {
        anchor_date: NaiveDate::from_ymd_opt(2026, 5, 7).unwrap(),
    };

    let json = serde_json::to_value(&query).unwrap();
    assert_eq!(json["anchor_date"], "2026-05-07");

    let restored: WeeklyLayoutQuery = serde_json::from_value(json).unwrap();
    assert_eq!(restored, query);
}

#[test]
fn scheduler_error_serializes_with_stable_tagged_shape() {
    let error = SchedulerError::Business(BusinessRuleError::SlotAlreadyBooked);

    let json = serde_json::to_value(&error).unwrap();

    assert_eq!(json["kind"], "Business");
    assert_eq!(json["detail"], "SlotAlreadyBooked");

    let restored: SchedulerError = serde_json::from_value(json).unwrap();
    assert_eq!(restored, error);
}
