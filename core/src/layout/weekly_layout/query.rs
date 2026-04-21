use chrono::{Datelike, Duration, NaiveDate};
use serde::{Deserialize, Serialize};

use crate::StructuralError;
use crate::{ActorId, domain::week::WeekRange};

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct WeeklyLayoutQuery {
    pub anchor_date: NaiveDate,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub assignee_id: Option<ActorId>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub visible_start_minute: Option<u16>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub visible_end_minute: Option<u16>,
}

pub const DAYS_PER_WEEK: i64 = 7;
pub const MINUTES_PER_DAY: u16 = 1440;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct VisibleMinuteWindow {
    pub start_minute: u16,
    pub end_minute: u16,
}

impl WeeklyLayoutQuery {
    pub fn new(anchor_date: NaiveDate) -> Self {
        Self {
            anchor_date,
            assignee_id: None,
            visible_start_minute: None,
            visible_end_minute: None,
        }
    }

    pub fn next_week(&self) -> Self {
        Self {
            anchor_date: self.anchor_date + Duration::days(DAYS_PER_WEEK),
            ..self.clone()
        }
    }

    pub fn previous_week(&self) -> Self {
        Self {
            anchor_date: self.anchor_date - Duration::days(DAYS_PER_WEEK),
            ..self.clone()
        }
    }
}

pub fn week_range_from_anchor(anchor_date: NaiveDate) -> WeekRange {
    let days_from_monday = i64::from(anchor_date.weekday().num_days_from_monday());
    let week_start = anchor_date - Duration::days(days_from_monday);
    let week_end = week_start + Duration::days(DAYS_PER_WEEK);

    WeekRange::new(week_start, week_end).expect("week bounds are always valid")
}

pub fn day_start_from_week(week_start: NaiveDate, day_index: u8) -> Option<NaiveDate> {
    if day_index > 6 {
        return None;
    }

    Some(week_start + Duration::days(i64::from(day_index)))
}

pub fn resolve_visible_minute_window(
    query: &WeeklyLayoutQuery,
) -> Result<Option<VisibleMinuteWindow>, StructuralError> {
    if query.visible_start_minute.is_none() && query.visible_end_minute.is_none() {
        return Ok(None);
    }

    let start_minute = query.visible_start_minute.unwrap_or(0);
    let end_minute = query.visible_end_minute.unwrap_or(MINUTES_PER_DAY);

    if start_minute > MINUTES_PER_DAY || end_minute > MINUTES_PER_DAY || start_minute >= end_minute
    {
        return Err(StructuralError::InvalidVisibleWindow);
    }

    Ok(Some(VisibleMinuteWindow {
        start_minute,
        end_minute,
    }))
}
