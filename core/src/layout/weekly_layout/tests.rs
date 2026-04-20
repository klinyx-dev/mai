use chrono::{Datelike, NaiveDate, TimeZone, Utc};

use super::{
    WeeklyLayoutQuery, day_start_from_week, project_appointment_layout_nodes,
    project_slot_layout_nodes, week_range_from_anchor,
};
use crate::domain::appointment::Appointment;
use crate::domain::enums::SlotStatus;
use crate::domain::ids::{ActorId, AppointmentId, SlotId};
use crate::domain::slot::Slot;
use crate::domain::time_range::TimeRange;
use crate::state::schedule_state::ScheduleState;

#[test]
fn computes_monday_aligned_week_for_midweek_anchor() {
    let anchor = NaiveDate::from_ymd_opt(2026, 1, 8).unwrap(); // Thursday
    let week = week_range_from_anchor(anchor);

    assert_eq!(week.start, NaiveDate::from_ymd_opt(2026, 1, 5).unwrap());
    assert_eq!(week.end, NaiveDate::from_ymd_opt(2026, 1, 12).unwrap());
}

#[test]
fn computes_previous_monday_for_sunday_anchor() {
    let anchor = NaiveDate::from_ymd_opt(2026, 1, 11).unwrap(); // Sunday
    let week = week_range_from_anchor(anchor);

    assert_eq!(week.start, NaiveDate::from_ymd_opt(2026, 1, 5).unwrap());
    assert_eq!(week.end, NaiveDate::from_ymd_opt(2026, 1, 12).unwrap());
}

#[test]
fn week_range_always_spans_exactly_seven_days() {
    let dates = [
        NaiveDate::from_ymd_opt(2026, 1, 5).unwrap(),
        NaiveDate::from_ymd_opt(2026, 1, 6).unwrap(),
        NaiveDate::from_ymd_opt(2026, 1, 7).unwrap(),
        NaiveDate::from_ymd_opt(2026, 1, 8).unwrap(),
        NaiveDate::from_ymd_opt(2026, 1, 9).unwrap(),
        NaiveDate::from_ymd_opt(2026, 1, 10).unwrap(),
        NaiveDate::from_ymd_opt(2026, 1, 11).unwrap(),
        NaiveDate::from_ymd_opt(2026, 1, 31).unwrap(),
    ];

    for anchor in dates {
        let week = week_range_from_anchor(anchor);
        assert_eq!(week.start.weekday().num_days_from_monday(), 0);
        assert_eq!((week.end - week.start).num_days(), 7);
        assert!(week.contains(anchor));
    }
}

#[test]
fn returns_day_start_for_valid_indices() {
    let week_start = NaiveDate::from_ymd_opt(2026, 1, 5).unwrap();

    assert_eq!(
        day_start_from_week(week_start, 0),
        Some(NaiveDate::from_ymd_opt(2026, 1, 5).unwrap())
    );
    assert_eq!(
        day_start_from_week(week_start, 6),
        Some(NaiveDate::from_ymd_opt(2026, 1, 11).unwrap())
    );
}

#[test]
fn rejects_out_of_range_day_index() {
    let week_start = NaiveDate::from_ymd_opt(2026, 1, 5).unwrap();

    assert_eq!(day_start_from_week(week_start, 7), None);
    assert_eq!(day_start_from_week(week_start, u8::MAX), None);
}

#[test]
fn projects_only_available_slots_in_visible_week() {
    let mut state = ScheduleState::new();
    state.slots.insert(
        SlotId::new("available-visible"),
        slot(
            "available-visible",
            SlotStatus::Available,
            Utc.with_ymd_and_hms(2026, 1, 7, 9, 15, 0).unwrap(),
            Utc.with_ymd_and_hms(2026, 1, 7, 10, 0, 0).unwrap(),
        ),
    );
    state.slots.insert(
        SlotId::new("booked-visible"),
        slot(
            "booked-visible",
            SlotStatus::Booked,
            Utc.with_ymd_and_hms(2026, 1, 7, 11, 0, 0).unwrap(),
            Utc.with_ymd_and_hms(2026, 1, 7, 12, 0, 0).unwrap(),
        ),
    );
    state.slots.insert(
        SlotId::new("cancelled-visible"),
        slot(
            "cancelled-visible",
            SlotStatus::Cancelled,
            Utc.with_ymd_and_hms(2026, 1, 7, 13, 0, 0).unwrap(),
            Utc.with_ymd_and_hms(2026, 1, 7, 14, 0, 0).unwrap(),
        ),
    );
    state.slots.insert(
        SlotId::new("available-outside"),
        slot(
            "available-outside",
            SlotStatus::Available,
            Utc.with_ymd_and_hms(2026, 1, 13, 9, 0, 0).unwrap(),
            Utc.with_ymd_and_hms(2026, 1, 13, 10, 0, 0).unwrap(),
        ),
    );

    let nodes = project_slot_layout_nodes(
        &state,
        &WeeklyLayoutQuery {
            anchor_date: NaiveDate::from_ymd_opt(2026, 1, 8).unwrap(),
        },
    );

    assert_eq!(nodes.len(), 1);
    assert_eq!(nodes[0].slot_id, SlotId::new("available-visible"));
    assert_eq!(nodes[0].day_index, 2);
    assert_eq!(nodes[0].start_minute, 9 * 60 + 15);
    assert_eq!(nodes[0].end_minute, 10 * 60);
    assert!(!nodes[0].clipped_start);
    assert!(!nodes[0].clipped_end);
}

#[test]
fn applies_week_and_day_clipping_flags_and_offsets() {
    let mut state = ScheduleState::new();
    state.slots.insert(
        SlotId::new("cross-week-start"),
        slot(
            "cross-week-start",
            SlotStatus::Available,
            Utc.with_ymd_and_hms(2026, 1, 4, 23, 30, 0).unwrap(),
            Utc.with_ymd_and_hms(2026, 1, 5, 1, 0, 0).unwrap(),
        ),
    );
    state.slots.insert(
        SlotId::new("cross-day"),
        slot(
            "cross-day",
            SlotStatus::Available,
            Utc.with_ymd_and_hms(2026, 1, 8, 23, 30, 0).unwrap(),
            Utc.with_ymd_and_hms(2026, 1, 9, 1, 0, 0).unwrap(),
        ),
    );

    let nodes = project_slot_layout_nodes(
        &state,
        &WeeklyLayoutQuery {
            anchor_date: NaiveDate::from_ymd_opt(2026, 1, 8).unwrap(),
        },
    );

    assert_eq!(nodes.len(), 2);

    assert_eq!(nodes[0].slot_id, SlotId::new("cross-week-start"));
    assert_eq!(nodes[0].day_index, 0);
    assert_eq!(nodes[0].start_minute, 0);
    assert_eq!(nodes[0].end_minute, 60);
    assert!(nodes[0].clipped_start);
    assert!(!nodes[0].clipped_end);

    assert_eq!(nodes[1].slot_id, SlotId::new("cross-day"));
    assert_eq!(nodes[1].day_index, 3);
    assert_eq!(nodes[1].start_minute, 23 * 60 + 30);
    assert_eq!(nodes[1].end_minute, 24 * 60);
    assert!(!nodes[1].clipped_start);
    assert!(nodes[1].clipped_end);
}

#[test]
fn returns_deterministic_order_for_equivalent_slots() {
    let mut state = ScheduleState::new();
    state.slots.insert(
        SlotId::new("slot-b"),
        slot(
            "slot-b",
            SlotStatus::Available,
            Utc.with_ymd_and_hms(2026, 1, 7, 9, 0, 0).unwrap(),
            Utc.with_ymd_and_hms(2026, 1, 7, 10, 0, 0).unwrap(),
        ),
    );
    state.slots.insert(
        SlotId::new("slot-a"),
        slot(
            "slot-a",
            SlotStatus::Available,
            Utc.with_ymd_and_hms(2026, 1, 7, 9, 0, 0).unwrap(),
            Utc.with_ymd_and_hms(2026, 1, 7, 10, 0, 0).unwrap(),
        ),
    );
    state.slots.insert(
        SlotId::new("slot-c"),
        slot(
            "slot-c",
            SlotStatus::Available,
            Utc.with_ymd_and_hms(2026, 1, 7, 8, 0, 0).unwrap(),
            Utc.with_ymd_and_hms(2026, 1, 7, 9, 0, 0).unwrap(),
        ),
    );

    let nodes = project_slot_layout_nodes(
        &state,
        &WeeklyLayoutQuery {
            anchor_date: NaiveDate::from_ymd_opt(2026, 1, 8).unwrap(),
        },
    );

    let ordered_ids = nodes
        .iter()
        .map(|node| node.slot_id.as_str().to_string())
        .collect::<Vec<_>>();
    assert_eq!(ordered_ids, vec!["slot-c", "slot-a", "slot-b"]);
}

#[test]
fn projects_appointments_from_referenced_slot_time() {
    let mut state = ScheduleState::new();
    state.slots.insert(
        SlotId::new("slot-1"),
        slot(
            "slot-1",
            SlotStatus::Booked,
            Utc.with_ymd_and_hms(2026, 1, 8, 14, 30, 0).unwrap(),
            Utc.with_ymd_and_hms(2026, 1, 8, 15, 45, 0).unwrap(),
        ),
    );
    state.appointments.insert(
        AppointmentId::new("appt-1"),
        appointment("appt-1", "slot-1"),
    );

    let nodes = project_appointment_layout_nodes(
        &state,
        &WeeklyLayoutQuery {
            anchor_date: NaiveDate::from_ymd_opt(2026, 1, 8).unwrap(),
        },
    );

    assert_eq!(nodes.len(), 1);
    assert_eq!(nodes[0].appointment_id, AppointmentId::new("appt-1"));
    assert_eq!(nodes[0].slot_id, SlotId::new("slot-1"));
    assert_eq!(nodes[0].day_index, 3);
    assert_eq!(nodes[0].start_minute, 14 * 60 + 30);
    assert_eq!(nodes[0].end_minute, 15 * 60 + 45);
    assert!(!nodes[0].clipped_start);
    assert!(!nodes[0].clipped_end);
}

#[test]
fn includes_only_appointments_with_visible_referenced_slots() {
    let mut state = ScheduleState::new();
    state.slots.insert(
        SlotId::new("slot-visible"),
        slot(
            "slot-visible",
            SlotStatus::Booked,
            Utc.with_ymd_and_hms(2026, 1, 10, 9, 0, 0).unwrap(),
            Utc.with_ymd_and_hms(2026, 1, 10, 10, 0, 0).unwrap(),
        ),
    );
    state.slots.insert(
        SlotId::new("slot-outside"),
        slot(
            "slot-outside",
            SlotStatus::Booked,
            Utc.with_ymd_and_hms(2026, 1, 13, 9, 0, 0).unwrap(),
            Utc.with_ymd_and_hms(2026, 1, 13, 10, 0, 0).unwrap(),
        ),
    );
    state.appointments.insert(
        AppointmentId::new("appt-visible"),
        appointment("appt-visible", "slot-visible"),
    );
    state.appointments.insert(
        AppointmentId::new("appt-outside"),
        appointment("appt-outside", "slot-outside"),
    );
    state.appointments.insert(
        AppointmentId::new("appt-missing-slot"),
        appointment("appt-missing-slot", "missing-slot"),
    );

    let nodes = project_appointment_layout_nodes(
        &state,
        &WeeklyLayoutQuery {
            anchor_date: NaiveDate::from_ymd_opt(2026, 1, 8).unwrap(),
        },
    );

    assert_eq!(nodes.len(), 1);
    assert_eq!(nodes[0].appointment_id, AppointmentId::new("appt-visible"));
    assert_eq!(nodes[0].slot_id, SlotId::new("slot-visible"));
}

#[test]
fn appointment_projection_is_deterministically_sorted() {
    let mut state = ScheduleState::new();
    state.slots.insert(
        SlotId::new("slot-a"),
        slot(
            "slot-a",
            SlotStatus::Booked,
            Utc.with_ymd_and_hms(2026, 1, 7, 10, 0, 0).unwrap(),
            Utc.with_ymd_and_hms(2026, 1, 7, 11, 0, 0).unwrap(),
        ),
    );
    state.slots.insert(
        SlotId::new("slot-b"),
        slot(
            "slot-b",
            SlotStatus::Booked,
            Utc.with_ymd_and_hms(2026, 1, 7, 10, 0, 0).unwrap(),
            Utc.with_ymd_and_hms(2026, 1, 7, 11, 0, 0).unwrap(),
        ),
    );
    state.slots.insert(
        SlotId::new("slot-c"),
        slot(
            "slot-c",
            SlotStatus::Booked,
            Utc.with_ymd_and_hms(2026, 1, 7, 8, 0, 0).unwrap(),
            Utc.with_ymd_and_hms(2026, 1, 7, 9, 0, 0).unwrap(),
        ),
    );
    state.appointments.insert(
        AppointmentId::new("appt-b"),
        appointment("appt-b", "slot-b"),
    );
    state.appointments.insert(
        AppointmentId::new("appt-a"),
        appointment("appt-a", "slot-a"),
    );
    state.appointments.insert(
        AppointmentId::new("appt-c"),
        appointment("appt-c", "slot-c"),
    );

    let nodes = project_appointment_layout_nodes(
        &state,
        &WeeklyLayoutQuery {
            anchor_date: NaiveDate::from_ymd_opt(2026, 1, 8).unwrap(),
        },
    );

    let ordered_ids = nodes
        .iter()
        .map(|node| node.appointment_id.as_str().to_string())
        .collect::<Vec<_>>();
    assert_eq!(ordered_ids, vec!["appt-c", "appt-a", "appt-b"]);
}

#[test]
fn projections_are_identical_across_insertion_orders() {
    let query = WeeklyLayoutQuery {
        anchor_date: NaiveDate::from_ymd_opt(2026, 1, 8).unwrap(),
    };

    let mut state_a = ScheduleState::new();
    state_a.slots.insert(
        SlotId::new("slot-available"),
        slot(
            "slot-available",
            SlotStatus::Available,
            Utc.with_ymd_and_hms(2026, 1, 7, 8, 0, 0).unwrap(),
            Utc.with_ymd_and_hms(2026, 1, 7, 9, 0, 0).unwrap(),
        ),
    );
    state_a.slots.insert(
        SlotId::new("slot-booked"),
        slot(
            "slot-booked",
            SlotStatus::Booked,
            Utc.with_ymd_and_hms(2026, 1, 7, 10, 0, 0).unwrap(),
            Utc.with_ymd_and_hms(2026, 1, 7, 11, 0, 0).unwrap(),
        ),
    );
    state_a.slots.insert(
        SlotId::new("slot-cancelled"),
        slot(
            "slot-cancelled",
            SlotStatus::Cancelled,
            Utc.with_ymd_and_hms(2026, 1, 7, 12, 0, 0).unwrap(),
            Utc.with_ymd_and_hms(2026, 1, 7, 13, 0, 0).unwrap(),
        ),
    );
    state_a.appointments.insert(
        AppointmentId::new("appt-1"),
        appointment("appt-1", "slot-booked"),
    );

    let mut state_b = ScheduleState::new();
    state_b.appointments.insert(
        AppointmentId::new("appt-1"),
        appointment("appt-1", "slot-booked"),
    );
    state_b.slots.insert(
        SlotId::new("slot-cancelled"),
        slot(
            "slot-cancelled",
            SlotStatus::Cancelled,
            Utc.with_ymd_and_hms(2026, 1, 7, 12, 0, 0).unwrap(),
            Utc.with_ymd_and_hms(2026, 1, 7, 13, 0, 0).unwrap(),
        ),
    );
    state_b.slots.insert(
        SlotId::new("slot-booked"),
        slot(
            "slot-booked",
            SlotStatus::Booked,
            Utc.with_ymd_and_hms(2026, 1, 7, 10, 0, 0).unwrap(),
            Utc.with_ymd_and_hms(2026, 1, 7, 11, 0, 0).unwrap(),
        ),
    );
    state_b.slots.insert(
        SlotId::new("slot-available"),
        slot(
            "slot-available",
            SlotStatus::Available,
            Utc.with_ymd_and_hms(2026, 1, 7, 8, 0, 0).unwrap(),
            Utc.with_ymd_and_hms(2026, 1, 7, 9, 0, 0).unwrap(),
        ),
    );

    let slots_a = project_slot_layout_nodes(&state_a, &query);
    let appointments_a = project_appointment_layout_nodes(&state_a, &query);

    let slots_b = project_slot_layout_nodes(&state_b, &query);
    let appointments_b = project_appointment_layout_nodes(&state_b, &query);

    assert_eq!(slots_a, slots_b);
    assert_eq!(appointments_a, appointments_b);
}

#[test]
fn slot_projection_never_leaks_booked_or_cancelled_slots() {
    let mut state = ScheduleState::new();
    state.slots.insert(
        SlotId::new("available-1"),
        slot(
            "available-1",
            SlotStatus::Available,
            Utc.with_ymd_and_hms(2026, 1, 6, 9, 0, 0).unwrap(),
            Utc.with_ymd_and_hms(2026, 1, 6, 10, 0, 0).unwrap(),
        ),
    );
    state.slots.insert(
        SlotId::new("booked-1"),
        slot(
            "booked-1",
            SlotStatus::Booked,
            Utc.with_ymd_and_hms(2026, 1, 6, 10, 0, 0).unwrap(),
            Utc.with_ymd_and_hms(2026, 1, 6, 11, 0, 0).unwrap(),
        ),
    );
    state.slots.insert(
        SlotId::new("cancelled-1"),
        slot(
            "cancelled-1",
            SlotStatus::Cancelled,
            Utc.with_ymd_and_hms(2026, 1, 6, 11, 0, 0).unwrap(),
            Utc.with_ymd_and_hms(2026, 1, 6, 12, 0, 0).unwrap(),
        ),
    );
    state.slots.insert(
        SlotId::new("available-2"),
        slot(
            "available-2",
            SlotStatus::Available,
            Utc.with_ymd_and_hms(2026, 1, 6, 12, 0, 0).unwrap(),
            Utc.with_ymd_and_hms(2026, 1, 6, 13, 0, 0).unwrap(),
        ),
    );
    state.appointments.insert(
        AppointmentId::new("appt-booked"),
        appointment("appt-booked", "booked-1"),
    );

    let nodes = project_slot_layout_nodes(
        &state,
        &WeeklyLayoutQuery {
            anchor_date: NaiveDate::from_ymd_opt(2026, 1, 8).unwrap(),
        },
    );

    let projected_ids = nodes
        .iter()
        .map(|node| node.slot_id.as_str().to_string())
        .collect::<Vec<_>>();

    assert_eq!(projected_ids, vec!["available-1", "available-2"]);
}

fn slot(
    id: &str,
    status: SlotStatus,
    start: chrono::DateTime<Utc>,
    end: chrono::DateTime<Utc>,
) -> Slot {
    Slot::with_status(
        SlotId::new(id),
        TimeRange::new(start, end).unwrap(),
        ActorId::new("assignee-1"),
        ActorId::new("creator-1"),
        status,
    )
}

fn appointment(id: &str, slot_id: &str) -> Appointment {
    Appointment::new(
        AppointmentId::new(id),
        SlotId::new(slot_id),
        vec![ActorId::new("invitee-1")],
        "Consultation",
        ActorId::new("creator-1"),
    )
}
