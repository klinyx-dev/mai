use crate::application::command_result::CommandResult;
use crate::layout::weekly_layout::{
    project_appointment_layout_nodes_resolved, project_blackout_layout_nodes_resolved,
    project_slot_layout_nodes_resolved,
    resolve_weekly_layout_query,
};
use crate::layout::{WeeklyLayout, WeeklyLayoutQuery};

use super::SchedulerService;

impl SchedulerService {
    #[deprecated(
        note = "use get_weekly_layout_checked to handle invalid query windows without panicking"
    )]
    pub fn get_weekly_layout(&self, query: WeeklyLayoutQuery) -> WeeklyLayout {
        self.get_weekly_layout_checked(query)
            .expect("weekly layout query must be valid")
    }

    pub fn get_weekly_layout_checked(
        &self,
        query: WeeklyLayoutQuery,
    ) -> CommandResult<WeeklyLayout> {
        let resolved_query = resolve_weekly_layout_query(query)?;
        let slots = project_slot_layout_nodes_resolved(&self.state, &resolved_query);
        let appointments = project_appointment_layout_nodes_resolved(&self.state, &resolved_query);
        let blackout_windows = project_blackout_layout_nodes_resolved(&self.state, &resolved_query);

        Ok(WeeklyLayout {
            week_start: resolved_query.week.start,
            week_end: resolved_query.week.end,
            slots,
            appointments,
            blackout_windows,
        })
    }
}
