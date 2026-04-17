
use crate::application::errors::SchedulerError;

pub type CommandResult<T = ()> = Result<T, SchedulerError>;
