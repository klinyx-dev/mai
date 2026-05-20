# Provider Board Contract

This document defines board modes and action capability boundaries for `MaiBoardInteractive`.

Primary implementation:
- `web/packages/mai-ui-vue/src/features/interactive-board/MaiBoardInteractive.tsx`
- `web/packages/mai-ui-vue/src/features/interactive-board/internal/board-interactive-contract.ts`
- `web/packages/mai-ui-vue/src/types/interactive.ts`

## Board Modes

`MaiBoardMode`:
- `read-only`
- `booking-client`
- `provider-admin`
- `debug-admin`

`mode` is a typed prop on `MaiBoardInteractive` and defaults to `provider-admin`.

## Capability Matrix

| Action | read-only | booking-client | provider-admin | debug-admin |
|---|---|---|---|---|
| Navigate week | allowed | allowed | allowed | allowed |
| View filter change | allowed | allowed | allowed | allowed |
| Select slot/appointment | allowed | allowed | allowed | allowed |
| Create slot | denied | denied | allowed | allowed |
| Reschedule slot | denied | denied | allowed | allowed |
| Cancel slot | denied | denied | allowed | allowed |
| Delete slot | denied | denied | allowed | allowed |
| Book slot | denied | allowed | allowed | allowed |
| Cancel appointment | denied | denied | allowed | allowed |
| Delete appointment | denied | denied | allowed | allowed |

Notes:
- enforcement should be performed through `actions`/`visibleActions` configuration by the consuming app.
- the `mode` prop provides explicit intent and diagnostics but does not replace backend authorization.

## Payload Contract

Provider/admin workflows use typed payloads:
- create: `CreateSlotActionEventPayload`
- reschedule: `SlotRescheduleActionEventPayload`
- cancel/delete/book slot: `SlotActionEventPayload`
- cancel/delete appointment: `AppointmentActionEventPayload`

Any backend mutation bridge should use:
- `mutateCommand: MaiActionRunner<AnyCommandEnvelope>`

## Error and Recovery Contract

On rejected or failed actions:
- emit `interaction-error` with `MaiInteractionErrorPayload`.
- preserve current selection state (`nextState = state`) when rejection/failure occurs.
- clear selection only after successful action.

## Core Validation Boundary

UI prevalidation is advisory only.

Authoritative validation and state transitions remain in core/adapter:
- overlap rejection
- state eligibility (`available`, `booked`, `cancelled`)
- cancellation authorization
- deterministic error categories/codes

## Related Docs

- `docs/provider_availability_usage.md`
- `docs/booking_flow_usage.md`
- `docs/adapter_error_codes.md`
