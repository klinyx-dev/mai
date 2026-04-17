use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Clone, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct TimeRange {
    pub start: DateTime<Utc>,
    pub end: DateTime<Utc>,
}

#[derive(Clone, Debug, PartialEq, Eq, Error)]
pub enum TimeRangeError {
    #[error("time range is invalid: start must be strictly before end")]
    InvalidBounds,
}

impl TimeRange {
    pub fn new(start: DateTime<Utc>, end: DateTime<Utc>) -> Result<Self, TimeRangeError> {
        if start >= end {
            return Err(TimeRangeError::InvalidBounds);
        }
        Ok(Self { start, end })
    }

    pub fn duration(&self) -> Duration {
        self.end - self.start
    }
}

#[cfg(test)]
mod tests {
    use super::{TimeRange, TimeRangeError};
    use chrono::{Duration, TimeZone, Utc};

    #[test]
    fn accepts_valid_time_range() {
        let start = Utc.with_ymd_and_hms(2026, 1, 1, 9, 0, 0).unwrap();
        let end = Utc.with_ymd_and_hms(2026, 1, 1, 10, 0, 0).unwrap();

        let range = TimeRange::new(start, end).expect("valid range should be created");

        assert_eq!(range.start, start);
        assert_eq!(range.end, end);
        assert_eq!(range.duration(), Duration::hours(1));
    }

    #[test]
    fn rejects_equals_start_and_end() {
        let start = Utc.with_ymd_and_hms(2026, 1, 1, 9, 0, 0).unwrap();
        let end = start;

        let error = TimeRange::new(start, end).expect_err("equal timestamps must be rejected");

        assert_eq!(error, TimeRangeError::InvalidBounds);
    }

    #[test]
    fn rejects_start_after_end() {
        let start = Utc.with_ymd_and_hms(2026, 1, 1, 10, 0, 0).unwrap();
        let end = Utc.with_ymd_and_hms(2026, 1, 1, 9, 0, 0).unwrap();

        let error = TimeRange::new(start, end).expect_err("start must be before end");

        assert_eq!(error, TimeRangeError::InvalidBounds);
    }
}
