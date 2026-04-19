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

#[cfg(test)]
mod tests {
    use super::{day_start_from_week, week_range_from_anchor};
    use chrono::{Datelike, NaiveDate};

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
}
