use chrono::{Datelike, Duration, NaiveDate};
use serde::{Deserialize, Serialize};

use crate::domain::enums::SlotStatus;
use crate::domain::slot::Slot;
use crate::domain::week::WeekRange;
use crate::layout::clipping::clip_time_range_to_week;
use crate::layout::output::{AppointmentLayoutNode, SlotLayoutNode};
use crate::state::schedule_state::ScheduleState;

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct WeeklyLayoutQuery {
    pub anchor_date: NaiveDate,
}

pub const DAYS_PER_WEEK: i64 = 7;

/// Computes the week range (Monday to Sunday) that contains the given anchor date.
pub fn week_range_from_anchor(anchor_date: NaiveDate) -> WeekRange {
    let days_from_monday = i64::from(anchor_date.weekday().num_days_from_monday());
    let week_start = anchor_date - Duration::days(days_from_monday);
    let week_end = week_start + Duration::days(DAYS_PER_WEEK);

    WeekRange::new(week_start, week_end).expect("week bounds are always valid")
}

/// Computes the start date of the given day index within the week (0 = Monday, 6 = Sunday).
pub fn day_start_from_week(week_start: NaiveDate, day_index: u8) -> Option<NaiveDate> {
    if day_index > 6 {
        return None;
    }

    Some(week_start + Duration::days(i64::from(day_index)))
}

pub fn project_slot_layout_nodes(
    state: &ScheduleState,
    query: &WeeklyLayoutQuery,
) -> Vec<SlotLayoutNode> {
    let week = week_range_from_anchor(query.anchor_date);
    let mut nodes = state
        .slots
        .values()
        .filter_map(|slot| slot_to_layout_node(slot, &week))
        .collect::<Vec<_>>();

    nodes.sort_by(|left, right| {
        (
            left.day_index,
            left.start_minute,
            left.end_minute,
            left.slot_id.as_str(),
        )
            .cmp(&(
                right.day_index,
                right.start_minute,
                right.end_minute,
                right.slot_id.as_str(),
            ))
    });

    nodes
}

pub fn project_appointment_layout_nodes(
    state: &ScheduleState,
    query: &WeeklyLayoutQuery,
) -> Vec<AppointmentLayoutNode> {
    let week = week_range_from_anchor(query.anchor_date);
    let mut nodes = state
        .appointments
        .values()
        .filter_map(|appointment| {
            let slot = state.slots.get(&appointment.slot_id)?;
            let position = slot_layout_position(slot, &week)?;

            Some(AppointmentLayoutNode {
                appointment_id: appointment.id.clone(),
                slot_id: appointment.slot_id.clone(),
                day_index: position.day_index,
                start_minute: position.start_minute,
                end_minute: position.end_minute,
                clipped_start: position.clipped_start,
                clipped_end: position.clipped_end,
            })
        })
        .collect::<Vec<_>>();

    nodes.sort_by(|left, right| {
        (
            left.day_index,
            left.start_minute,
            left.end_minute,
            left.appointment_id.as_str(),
        )
            .cmp(&(
                right.day_index,
                right.start_minute,
                right.end_minute,
                right.appointment_id.as_str(),
            ))
    });

    nodes
}

fn slot_to_layout_node(slot: &Slot, week: &WeekRange) -> Option<SlotLayoutNode> {
    if slot.status != SlotStatus::Available {
        return None;
    }

    let position = slot_layout_position(slot, week)?;

    Some(SlotLayoutNode {
        slot_id: slot.id.clone(),
        day_index: position.day_index,
        start_minute: position.start_minute,
        end_minute: position.end_minute,
        clipped_start: position.clipped_start,
        clipped_end: position.clipped_end,
    })
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
struct SlotLayoutPosition {
    day_index: u8,
    start_minute: u16,
    end_minute: u16,
    clipped_start: bool,
    clipped_end: bool,
}

fn slot_layout_position(slot: &Slot, week: &WeekRange) -> Option<SlotLayoutPosition> {
    let week_clipped = clip_time_range_to_week(&slot.time, week)?;
    let day = week_clipped.start.date_naive();
    let day_start = day.and_hms_opt(0, 0, 0)?.and_utc();
    let day_end = day_start + Duration::days(1);
    let clipped_end_at_day = week_clipped.end > day_end;
    let visible_end = if clipped_end_at_day {
        day_end
    } else {
        week_clipped.end
    };
    let day_index = (day - week.start).num_days() as u8;
    let start_minute = minutes_since_day_start(week_clipped.start, day_start)?;
    let end_minute = minutes_since_day_start(visible_end, day_start)?;

    Some(SlotLayoutPosition {
        day_index,
        start_minute,
        end_minute,
        clipped_start: week_clipped.clipped_start,
        clipped_end: week_clipped.clipped_end || clipped_end_at_day,
    })
}

fn minutes_since_day_start(
    timestamp: chrono::DateTime<chrono::Utc>,
    day_start: chrono::DateTime<chrono::Utc>,
) -> Option<u16> {
    let minutes = (timestamp - day_start).num_minutes();
    u16::try_from(minutes).ok()
}

#[cfg(test)]
mod tests {
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
    use chrono::{Datelike, NaiveDate, TimeZone, Utc};

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
}
