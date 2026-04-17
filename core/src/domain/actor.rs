
use serde::{Deserialize, Serialize};

use crate::domain::ids::ActorId;

#[derive(Clone, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ActorRef {
    pub id: ActorId,
}

impl ActorRef {
    pub fn new(id: ActorId) -> Self {
        Self { id }
    }
}

#[cfg(test)]
mod tests {
    use super::ActorRef;
    use crate::domain::ids::ActorId;

    #[test]
    fn actor_ref_keeps_actor_id() {
        let actor_id = ActorId::new("actor-123");
        let actor_ref = ActorRef::new(actor_id.clone());

        assert_eq!(actor_ref.id, actor_id);
    }
}
