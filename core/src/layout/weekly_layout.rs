use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct WeeklyLayoutQuery {
    pub anchor_date: NaiveDate,
}
