use chrono::{LocalResult, NaiveDate, TimeZone, Utc};

use crate::{ActorId, CalendarOwnerFilter, WeeklyLayoutQuery};

use super::{WasmAdapterError, WasmViewFilterMode, WasmWeeklyLayoutQuery};

pub(crate) fn normalize_weekly_anchor_date(
    query: &WasmWeeklyLayoutQuery,
) -> Result<NaiveDate, WasmAdapterError> {
    let timezone_name = query
        .timezone
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string);

    let Some(timezone_name) = timezone_name else {
        return Ok(query.anchor_date);
    };

    let timezone = timezone_name
        .parse::<chrono_tz::Tz>()
        .map_err(|_| WasmAdapterError::invalid_timezone())?;

    local_anchor_to_utc_date(query.anchor_date, timezone)
        .ok_or_else(WasmAdapterError::invalid_timezone)
}

pub(crate) fn core_weekly_query(
    anchor_date: NaiveDate,
    query: &WasmWeeklyLayoutQuery,
) -> WeeklyLayoutQuery {
    WeeklyLayoutQuery {
        anchor_date,
        owner_filter: query
            .view_filter
            .as_ref()
            .map_or(CalendarOwnerFilter::All, |view_filter| {
                match view_filter.mode {
                    WasmViewFilterMode::All => CalendarOwnerFilter::All,
                    WasmViewFilterMode::None => CalendarOwnerFilter::None,
                    WasmViewFilterMode::Owners | WasmViewFilterMode::Group => {
                        CalendarOwnerFilter::from_owner_ids(
                            view_filter
                                .ids
                                .iter()
                                .map(|id| ActorId::new(id.as_str()))
                                .collect(),
                        )
                    }
                }
            }),
        visible_start_minute: query.visible_start_minute,
        visible_end_minute: query.visible_end_minute,
    }
}

fn local_anchor_to_utc_date(anchor_date: NaiveDate, timezone: chrono_tz::Tz) -> Option<NaiveDate> {
    for hour in 0..24 {
        let local_time = anchor_date.and_hms_opt(hour, 0, 0)?;
        let utc_date = match timezone.from_local_datetime(&local_time) {
            LocalResult::Single(date_time) => Some(date_time.with_timezone(&Utc).date_naive()),
            LocalResult::Ambiguous(left, right) => {
                Some(left.min(right).with_timezone(&Utc).date_naive())
            }
            LocalResult::None => None,
        };

        if let Some(date) = utc_date {
            return Some(date);
        }
    }

    None
}
