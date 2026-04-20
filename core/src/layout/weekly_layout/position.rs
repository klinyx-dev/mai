use chrono::{DateTime, Duration, Utc};

use crate::domain::slot::Slot;
use crate::domain::week::WeekRange;
use crate::layout::clipping::clip_time_range_to_week;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(super) struct SlotLayoutPosition {
    pub(super) day_index: u8,
    pub(super) start_minute: u16,
    pub(super) end_minute: u16,
    pub(super) clipped_start: bool,
    pub(super) clipped_end: bool,
}

pub(super) fn slot_layout_position(slot: &Slot, week: &WeekRange) -> Option<SlotLayoutPosition> {
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

fn minutes_since_day_start(timestamp: DateTime<Utc>, day_start: DateTime<Utc>) -> Option<u16> {
    let minutes = (timestamp - day_start).num_minutes();
    u16::try_from(minutes).ok()
}
