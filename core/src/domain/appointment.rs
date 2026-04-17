
use serde::{Deserialize, Serialize};

use crate::domain::ids::{ActorId, AppointmentId, SlotId};

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Appointment {
    pub id: AppointmentId,
    pub slot_id: SlotId,
    pub invitee_ids: Vec<ActorId>,
    pub title: String,
    pub created_by: ActorId,
}

impl Appointment {
    pub fn new(
        id: AppointmentId,
        slot_id: SlotId,
        invitee_ids: Vec<ActorId>,
        title: impl Into<String>,
        created_by: ActorId,
    ) -> Self {
        Self {
            id,
            slot_id,
            invitee_ids,
            title: title.into(),
            created_by,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::Appointment;
    use crate::domain::ids::{ActorId, AppointmentId, SlotId};

    #[test]
    fn appointment_new_keeps_input_fields() {
        let appointment = Appointment::new(
            AppointmentId::new("appt-1"),
            SlotId::new("slot-1"),
            vec![ActorId::new("actor-2"), ActorId::new("actor-3")],
            "Consultation",
            ActorId::new("actor-1"),
        );

        assert_eq!(appointment.id.as_str(), "appt-1");
        assert_eq!(appointment.slot_id.as_str(), "slot-1");
        assert_eq!(appointment.invitee_ids.len(), 2);
        assert_eq!(appointment.title, "Consultation");
        assert_eq!(appointment.created_by.as_str(), "actor-1");
    }
}
