use chrono::{DateTime, Duration, NaiveDate, Utc};

use crate::domain::time_range::TimeRange;
use crate::domain::week::WeekRange;

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ClippedTimeRange {
    pub start: DateTime<Utc>,
    pub end: DateTime<Utc>,
    pub clipped_start: bool,
    pub clipped_end: bool,
}

pub fn clip_time_range_to_window(
    range: &TimeRange,
    window_start: DateTime<Utc>,
    window_end: DateTime<Utc>,
) -> Option<ClippedTimeRange> {
    if window_start >= window_end {
        return None;
    }

    let clipped_start = range.start.max(window_start);
    let clipped_end = range.end.min(window_end);

    if clipped_start >= clipped_end {
        return None;
    }

    Some(ClippedTimeRange {
        start: clipped_start,
        end: clipped_end,
        clipped_start: range.start < window_start,
        clipped_end: range.end > window_end,
    })
}

pub fn clip_time_range_to_week(range: &TimeRange, week: &WeekRange) -> Option<ClippedTimeRange> {
    let week_start = start_of_day_utc(week.start);
    let week_end = start_of_day_utc(week.end);
    clip_time_range_to_window(range, week_start, week_end)
}

pub fn clip_time_range_to_day(range: &TimeRange, day: NaiveDate) -> Option<ClippedTimeRange> {
    let day_start = start_of_day_utc(day);
    let day_end = day_start + Duration::days(1);
    clip_time_range_to_window(range, day_start, day_end)
}

fn start_of_day_utc(date: NaiveDate) -> DateTime<Utc> {
    date.and_hms_opt(0, 0, 0)
        .expect("midnight is always valid")
        .and_utc()
}

#[cfg(test)]
mod tests {
    use super::{
        clip_time_range_to_day, clip_time_range_to_week, clip_time_range_to_window,
        start_of_day_utc,
    };
    use crate::domain::time_range::TimeRange;
    use crate::domain::week::WeekRange;
    use chrono::{Duration, TimeZone, Utc};

    #[test]
    fn returns_none_for_non_intersecting_range() {
        let range = TimeRange::new(
            Utc.with_ymd_and_hms(2026, 1, 7, 10, 0, 0).unwrap(),
            Utc.with_ymd_and_hms(2026, 1, 7, 11, 0, 0).unwrap(),
        )
        .unwrap();
        let window_start = Utc.with_ymd_and_hms(2026, 1, 7, 11, 0, 0).unwrap();
        let window_end = Utc.with_ymd_and_hms(2026, 1, 7, 12, 0, 0).unwrap();

        assert_eq!(
            clip_time_range_to_window(&range, window_start, window_end),
            None
        );
    }

    #[test]
    fn keeps_range_when_fully_inside_window() {
        let range = TimeRange::new(
            Utc.with_ymd_and_hms(2026, 1, 7, 10, 0, 0).unwrap(),
            Utc.with_ymd_and_hms(2026, 1, 7, 11, 0, 0).unwrap(),
        )
        .unwrap();
        let window_start = Utc.with_ymd_and_hms(2026, 1, 7, 9, 0, 0).unwrap();
        let window_end = Utc.with_ymd_and_hms(2026, 1, 7, 12, 0, 0).unwrap();

        let clipped = clip_time_range_to_window(&range, window_start, window_end).unwrap();

        assert_eq!(clipped.start, range.start);
        assert_eq!(clipped.end, range.end);
        assert!(!clipped.clipped_start);
        assert!(!clipped.clipped_end);
    }

    #[test]
    fn clips_range_at_both_sides() {
        let range = TimeRange::new(
            Utc.with_ymd_and_hms(2026, 1, 7, 8, 0, 0).unwrap(),
            Utc.with_ymd_and_hms(2026, 1, 7, 13, 0, 0).unwrap(),
        )
        .unwrap();
        let window_start = Utc.with_ymd_and_hms(2026, 1, 7, 9, 0, 0).unwrap();
        let window_end = Utc.with_ymd_and_hms(2026, 1, 7, 12, 0, 0).unwrap();

        let clipped = clip_time_range_to_window(&range, window_start, window_end).unwrap();

        assert_eq!(clipped.start, window_start);
        assert_eq!(clipped.end, window_end);
        assert!(clipped.clipped_start);
        assert!(clipped.clipped_end);
    }

    #[test]
    fn clips_range_to_week_window() {
        let week = WeekRange::new(
            chrono::NaiveDate::from_ymd_opt(2026, 1, 5).unwrap(),
            chrono::NaiveDate::from_ymd_opt(2026, 1, 12).unwrap(),
        )
        .unwrap();
        let range = TimeRange::new(
            Utc.with_ymd_and_hms(2026, 1, 4, 23, 0, 0).unwrap(),
            Utc.with_ymd_and_hms(2026, 1, 5, 2, 0, 0).unwrap(),
        )
        .unwrap();

        let clipped = clip_time_range_to_week(&range, &week).unwrap();

        assert_eq!(clipped.start, start_of_day_utc(week.start));
        assert_eq!(
            clipped.end,
            start_of_day_utc(week.start) + Duration::hours(2)
        );
        assert!(clipped.clipped_start);
        assert!(!clipped.clipped_end);
    }

    #[test]
    fn clips_range_to_day_window() {
        let day = chrono::NaiveDate::from_ymd_opt(2026, 1, 7).unwrap();
        let range = TimeRange::new(
            Utc.with_ymd_and_hms(2026, 1, 6, 23, 30, 0).unwrap(),
            Utc.with_ymd_and_hms(2026, 1, 7, 1, 0, 0).unwrap(),
        )
        .unwrap();

        let clipped = clip_time_range_to_day(&range, day).unwrap();

        assert_eq!(clipped.start, start_of_day_utc(day));
        assert_eq!(
            clipped.end,
            Utc.with_ymd_and_hms(2026, 1, 7, 1, 0, 0).unwrap()
        );
        assert!(clipped.clipped_start);
        assert!(!clipped.clipped_end);
    }
}
