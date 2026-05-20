use crate::domain::enums::SlotStatus;
use crate::domain::slot::Slot;
use crate::domain::time_range::TimeRange;
use crate::layout::output::{AppointmentLayoutNode, BlackoutLayoutNode, SlotLayoutNode};
use crate::state::schedule_state::ScheduleState;

use super::position::{slot_layout_position, time_range_layout_position};
use super::query::{ResolvedWeeklyLayoutQuery, WeeklyLayoutQuery, resolve_weekly_layout_query};

pub fn project_slot_layout_nodes(
    state: &ScheduleState,
    query: &WeeklyLayoutQuery,
) -> Vec<SlotLayoutNode> {
    let resolved = resolve_weekly_layout_query(query.clone())
        .expect("projection requires validated weekly layout query");
    project_slot_layout_nodes_resolved(state, &resolved)
}

pub fn project_slot_layout_nodes_resolved(
    state: &ScheduleState,
    query: &ResolvedWeeklyLayoutQuery,
) -> Vec<SlotLayoutNode> {
    let mut nodes = state
        .slots_iter()
        .filter(|slot| query.owner_filter.matches_owner(&slot.resource_owner_id))
        .filter_map(|slot| slot_to_layout_node(slot, query))
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
    let resolved = resolve_weekly_layout_query(query.clone())
        .expect("projection requires validated weekly layout query");
    project_appointment_layout_nodes_resolved(state, &resolved)
}

pub fn project_appointment_layout_nodes_resolved(
    state: &ScheduleState,
    query: &ResolvedWeeklyLayoutQuery,
) -> Vec<AppointmentLayoutNode> {
    let mut nodes = state
        .appointments_iter()
        .filter_map(|appointment| {
            let slot = state.slot(&appointment.slot_id)?;

            // Filter appointments by the slot's resource owner.
            if !query.owner_filter.matches_owner(&slot.resource_owner_id) {
                return None;
            }

            let position = slot_layout_position(slot, &query.week)?;
            let clipped = apply_visible_window(
                position.start_minute,
                position.end_minute,
                position.clipped_start,
                position.clipped_end,
                query,
            )?;

            Some(AppointmentLayoutNode {
                appointment_id: appointment.id.clone(),
                slot_id: appointment.slot_id.clone(),
                day_index: position.day_index,
                start_minute: clipped.start_minute,
                end_minute: clipped.end_minute,
                clipped_start: clipped.clipped_start,
                clipped_end: clipped.clipped_end,
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

pub fn project_blackout_layout_nodes(
    state: &ScheduleState,
    query: &WeeklyLayoutQuery,
) -> Vec<BlackoutLayoutNode> {
    let resolved = resolve_weekly_layout_query(query.clone())
        .expect("projection requires validated weekly layout query");
    project_blackout_layout_nodes_resolved(state, &resolved)
}

pub fn project_blackout_layout_nodes_resolved(
    state: &ScheduleState,
    query: &ResolvedWeeklyLayoutQuery,
) -> Vec<BlackoutLayoutNode> {
    let mut nodes = state
        .blackout_windows_iter()
        .filter(|window| query.owner_filter.matches_owner(&window.resource_owner_id))
        .filter_map(|window| {
            let time = TimeRange::new(window.start, window.end).ok()?;
            let position = time_range_layout_position(&time, &query.week)?;
            let clipped = apply_visible_window(
                position.start_minute,
                position.end_minute,
                position.clipped_start,
                position.clipped_end,
                query,
            )?;
            Some(BlackoutLayoutNode {
                blackout_id: window.blackout_id.clone(),
                day_index: position.day_index,
                start_minute: clipped.start_minute,
                end_minute: clipped.end_minute,
                clipped_start: clipped.clipped_start,
                clipped_end: clipped.clipped_end,
            })
        })
        .collect::<Vec<_>>();

    nodes.sort_by(|left, right| {
        (
            left.day_index,
            left.start_minute,
            left.end_minute,
            left.blackout_id.as_str(),
        )
            .cmp(&(
                right.day_index,
                right.start_minute,
                right.end_minute,
                right.blackout_id.as_str(),
            ))
    });

    nodes
}

fn slot_to_layout_node(slot: &Slot, query: &ResolvedWeeklyLayoutQuery) -> Option<SlotLayoutNode> {
    if slot.status != SlotStatus::Available {
        return None;
    }

    let position = slot_layout_position(slot, &query.week)?;
    let clipped = apply_visible_window(
        position.start_minute,
        position.end_minute,
        position.clipped_start,
        position.clipped_end,
        query,
    )?;

    Some(SlotLayoutNode {
        slot_id: slot.id.clone(),
        day_index: position.day_index,
        start_minute: clipped.start_minute,
        end_minute: clipped.end_minute,
        clipped_start: clipped.clipped_start,
        clipped_end: clipped.clipped_end,
    })
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
struct VisibleWindowClippedPosition {
    start_minute: u16,
    end_minute: u16,
    clipped_start: bool,
    clipped_end: bool,
}

fn apply_visible_window(
    start_minute: u16,
    end_minute: u16,
    clipped_start: bool,
    clipped_end: bool,
    query: &ResolvedWeeklyLayoutQuery,
) -> Option<VisibleWindowClippedPosition> {
    let window_start = query.visible_window.start_minute;
    let window_end = query.visible_window.end_minute;

    if end_minute <= window_start || start_minute >= window_end {
        return None;
    }

    let clipped_start_minute = start_minute.max(window_start);
    let clipped_end_minute = end_minute.min(window_end);

    if clipped_start_minute >= clipped_end_minute {
        return None;
    }

    Some(VisibleWindowClippedPosition {
        start_minute: clipped_start_minute,
        end_minute: clipped_end_minute,
        clipped_start: clipped_start || clipped_start_minute > start_minute,
        clipped_end: clipped_end || clipped_end_minute < end_minute,
    })
}
