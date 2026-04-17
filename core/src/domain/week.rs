use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Clone, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct WeekRange {
    pub start: NaiveDate,
    pub end: NaiveDate,
}

#[derive(Clone, Debug, PartialEq, Eq, Error)]
pub enum WeekRangeError {
    #[error("week range is invalid: start must be strictly before end")]
    InvalidBounds,
}

impl WeekRange {
    pub fn new(start: NaiveDate, end: NaiveDate) -> Result<Self, WeekRangeError> {
        if start >= end {
            return Err(WeekRangeError::InvalidBounds);
        }

        Ok(Self { start, end })
    }

    pub fn contains(&self, date: NaiveDate) -> bool {
        self.start <= date && date < self.end
    }
}

#[cfg(test)]
mod tests {
    use super::{WeekRange, WeekRangeError};
    use chrono::NaiveDate;

    #[test]
    fn accepts_valid_week_range() {
        let week = WeekRange::new(
            NaiveDate::from_ymd_opt(2026, 1, 5).unwrap(),
            NaiveDate::from_ymd_opt(2026, 1, 12).unwrap(),
        )
        .unwrap();

        assert_eq!(week.start, NaiveDate::from_ymd_opt(2026, 1, 5).unwrap());
        assert_eq!(week.end, NaiveDate::from_ymd_opt(2026, 1, 12).unwrap());
    }

    #[test]
    fn rejects_equal_or_inverted_week_range() {
        let day = NaiveDate::from_ymd_opt(2026, 1, 5).unwrap();
        let equal_error = WeekRange::new(day, day).expect_err("equal bounds must fail");
        let inverted_error = WeekRange::new(
            NaiveDate::from_ymd_opt(2026, 1, 12).unwrap(),
            NaiveDate::from_ymd_opt(2026, 1, 5).unwrap(),
        )
        .expect_err("inverted bounds must fail");

        assert_eq!(equal_error, WeekRangeError::InvalidBounds);
        assert_eq!(inverted_error, WeekRangeError::InvalidBounds);
    }

    #[test]
    fn contains_includes_start_and_excludes_end() {
        let week = WeekRange::new(
            NaiveDate::from_ymd_opt(2026, 1, 5).unwrap(),
            NaiveDate::from_ymd_opt(2026, 1, 12).unwrap(),
        )
        .unwrap();

        assert!(week.contains(NaiveDate::from_ymd_opt(2026, 1, 5).unwrap()));
        assert!(week.contains(NaiveDate::from_ymd_opt(2026, 1, 11).unwrap()));
        assert!(!week.contains(NaiveDate::from_ymd_opt(2026, 1, 12).unwrap()));
    }
}
