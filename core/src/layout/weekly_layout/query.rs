use chrono::{Datelike, Duration, NaiveDate};
use serde::{Deserialize, Serialize};

use crate::domain::week::WeekRange;

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct WeeklyLayoutQuery {
    pub anchor_date: NaiveDate,
}

pub const DAYS_PER_WEEK: i64 = 7;

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
