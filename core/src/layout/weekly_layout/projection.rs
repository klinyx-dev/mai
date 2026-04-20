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

fn slot_to_layout_node(
    slot: &Slot,
    week: &crate::domain::week::WeekRange,
) -> Option<SlotLayoutNode> {
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
