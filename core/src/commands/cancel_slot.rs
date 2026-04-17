use serde::{Deserialize, Serialize};

use crate::domain::ids::SlotId;

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct CancelSlotCommand {
    pub slot_id: SlotId,
}
