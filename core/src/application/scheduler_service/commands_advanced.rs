use chrono::{Duration, TimeZone, Utc};

use crate::application::command_result::CommandResult;
use crate::application::errors::{BusinessRuleError, StructuralError};
use crate::commands::{
    AddBlackoutWindowCommand, AddRecurringTemplateCommand, AddSlotCommand, AddSlotsBatchCommand,
    ApplyRecurringTemplatesCommand, BatchMode,
};
use crate::domain::{BlackoutWindow, RecurringTemplate};

use super::SchedulerService;

impl SchedulerService {
    pub fn add_blackout_window(&mut self, cmd: AddBlackoutWindowCommand) -> CommandResult {
        self.ensure_actor_exists(
            &cmd.resource_owner_id,
            crate::application::ReferentialError::ResourceOwnerNotFound,
        )?;
        self.ensure_actor_exists(&cmd.created_by, crate::application::ReferentialError::CreatorNotFound)?;
        let blackout = BlackoutWindow {
            blackout_id: cmd.blackout_id,
            resource_owner_id: cmd.resource_owner_id,
            start: cmd.start,
            end: cmd.end,
            reason: cmd.reason,
            created_by: cmd.created_by,
        };
        blackout.validate()?;
        self.state.insert_blackout_window(blackout);
        Ok(())
    }

    pub fn add_recurring_template(&mut self, cmd: AddRecurringTemplateCommand) -> CommandResult {
        self.ensure_actor_exists(
            &cmd.resource_owner_id,
            crate::application::ReferentialError::ResourceOwnerNotFound,
        )?;
        self.ensure_actor_exists(&cmd.created_by, crate::application::ReferentialError::CreatorNotFound)?;
        let template = RecurringTemplate {
            template_id: cmd.template_id,
            resource_owner_id: cmd.resource_owner_id,
            weekday: cmd.weekday,
            start_minute: cmd.start_minute,
            end_minute: cmd.end_minute,
            effective_from: cmd.effective_from,
            effective_until: cmd.effective_until,
            created_by: cmd.created_by,
        };
        template.validate()?;
        self.state.insert_recurring_template(template);
        Ok(())
    }

    pub fn add_slots_batch(&mut self, cmd: AddSlotsBatchCommand) -> CommandResult {
        if cmd.slots.is_empty() {
            return Err(StructuralError::InvalidBatchPayload.into());
        }
        match cmd.mode {
            BatchMode::BestEffort => {
                for slot in cmd.slots {
                    let _ = self.add_slot(slot);
                }
                Ok(())
            }
            BatchMode::Atomic => {
                let snapshot = self.state.clone();
                for slot in cmd.slots {
                    if self.add_slot(slot).is_err() {
                        self.state = snapshot;
                        return Err(BusinessRuleError::BatchConflictDetected.into());
                    }
                }
                Ok(())
            }
        }
    }

    pub fn apply_recurring_templates(
        &mut self,
        cmd: ApplyRecurringTemplatesCommand,
    ) -> CommandResult {
        let week_end = cmd.week_start + Duration::days(7);
        let templates: Vec<_> = self
            .state
            .recurring_templates_iter()
            .filter(|t| {
                (cmd.owner_ids.is_empty() || cmd.owner_ids.contains(&t.resource_owner_id))
                    && t.effective_from < week_end
                    && t.effective_until >= cmd.week_start
            })
            .cloned()
            .collect();

        let mut generated = Vec::new();
        for template in templates {
            let day = cmd.week_start + Duration::days(i64::from(template.weekday));
            if day < template.effective_from || day > template.effective_until {
                continue;
            }
            let start = day
                .and_hms_opt(0, 0, 0)
                .expect("valid")
                + Duration::minutes(i64::from(template.start_minute));
            let end = day.and_hms_opt(0, 0, 0).expect("valid")
                + Duration::minutes(i64::from(template.end_minute));
            let add_cmd = AddSlotCommand {
                slot_id: template.generated_slot_id(day),
                start: Utc.from_utc_datetime(&start),
                end: Utc.from_utc_datetime(&end),
                resource_owner_id: template.resource_owner_id.clone(),
                created_by: cmd.created_by.clone(),
                capacity: 1,
            };
            generated.push(add_cmd);
        }

        if cmd.dry_run || generated.is_empty() {
            return Ok(());
        }

        self.add_slots_batch(AddSlotsBatchCommand {
            mode: BatchMode::Atomic,
            slots: generated,
        })
    }

    pub(crate) fn is_slot_blocked_by_blackout(
        &self,
        owner_id: &crate::domain::ActorId,
        start: chrono::DateTime<chrono::Utc>,
        end: chrono::DateTime<chrono::Utc>,
    ) -> bool {
        self.state
            .blackout_windows_iter()
            .any(|window| &window.resource_owner_id == owner_id && window.overlaps(start, end))
    }
}
