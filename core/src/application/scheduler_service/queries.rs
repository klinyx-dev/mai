use crate::application::command_result::CommandResult;
use crate::layout::weekly_layout::{
    project_appointment_layout_nodes, project_slot_layout_nodes, resolve_visible_minute_window,
    week_range_from_anchor,
};
use crate::layout::{WeeklyLayout, WeeklyLayoutQuery};

use super::SchedulerService;

impl SchedulerService {
    pub fn get_weekly_layout(&self, query: WeeklyLayoutQuery) -> WeeklyLayout {
        self.get_weekly_layout_checked(query)
            .expect("weekly layout query must be valid")
    }

    pub fn get_weekly_layout_checked(
        &self,
        query: WeeklyLayoutQuery,
    ) -> CommandResult<WeeklyLayout> {
        resolve_visible_minute_window(&query)?;

        let week = week_range_from_anchor(query.anchor_date);
        let slots = project_slot_layout_nodes(&self.state, &query);
        let appointments = project_appointment_layout_nodes(&self.state, &query);

        Ok(WeeklyLayout {
            week_start: week.start,
            week_end: week.end,
            slots,
            appointments,
        })
    }
}
