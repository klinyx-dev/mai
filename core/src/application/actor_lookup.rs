use crate::domain::ActorId;

/// Application-layer boundary for optional actor existence checks.
///
/// Phase 1 keeps actor IDs as opaque references by default. Consumers can
/// provide this collaborator to enforce actor-reference validation in command
/// flows without coupling core domain modules to storage concerns.
pub trait ActorLookup: Send + Sync {
    fn actor_exists(&self, actor_id: &ActorId) -> bool;
}
