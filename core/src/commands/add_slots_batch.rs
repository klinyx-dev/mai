use serde::{Deserialize, Serialize};

use crate::commands::AddSlotCommand;

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum BatchMode {
    Atomic,
    BestEffort,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct AddSlotsBatchCommand {
    pub mode: BatchMode,
    pub slots: Vec<AddSlotCommand>,
}
