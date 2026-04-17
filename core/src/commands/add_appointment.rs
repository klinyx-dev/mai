use serde::{Deserialize, Serialize};

use crate::domain::ids::{ActorId, AppointmentId, SlotId};

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct AddAppointmentCommand {
    pub appointment_id: AppointmentId,
    pub slot_id: SlotId,
    pub invitee_ids: Vec<ActorId>,
    pub title: String,
    pub created_by: ActorId,
}
