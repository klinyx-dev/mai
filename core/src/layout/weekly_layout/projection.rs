use crate::domain::enums::SlotStatus;
use crate::domain::slot::Slot;
use crate::layout::output::{AppointmentLayoutNode, SlotLayoutNode};
use crate::state::schedule_state::ScheduleState;

use super::position::slot_layout_position;
use super::query::{WeeklyLayoutQuery, week_range_from_anchor};

pub fn project_slot_layout_nodes(
    state: &ScheduleState,
    query: &WeeklyLayoutQuery,
) -> Vec<SlotLayoutNode> {
    let week = week_range_from_anchor(query.anchor_date);
    let mut nodes = state
        .slots
        .values()
        .filter(|slot| {
            query
                .assignee_id
                .as_ref()
                .is_none_or(|assignee| &slot.assignee_id == assignee)
        })
        .filter_map(|slot| slot_to_layout_node(slot, query, &week))
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

            // Filter appointments by slot's assignee
            if query
                .assignee_id
                .as_ref()
                .is_some_and(|assignee| &slot.assignee_id != assignee)
            {
                return None;
            }

            let position = slot_layout_position(slot, &week)?;
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

fn slot_to_layout_node(
    slot: &Slot,
    query: &WeeklyLayoutQuery,
    week: &crate::domain::week::WeekRange,
) -> Option<SlotLayoutNode> {
    if slot.status != SlotStatus::Available {
        return None;
    }

    let position = slot_layout_position(slot, week)?;
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
    query: &WeeklyLayoutQuery,
) -> Option<VisibleWindowClippedPosition> {
    let window_start = query.visible_start_minute.unwrap_or(0);
    let window_end = query
        .visible_end_minute
        .unwrap_or(crate::layout::weekly_layout::MINUTES_PER_DAY);

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
