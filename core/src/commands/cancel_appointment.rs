use serde::{Deserialize, Serialize};

use crate::domain::ids::{ActorId, AppointmentId};

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct CancelAppointmentCommand {
    pub appointment_id: AppointmentId,
    pub cancelled_by: ActorId,
}
