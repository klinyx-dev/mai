# Public API Inventory

This document inventories the stable, consumer-facing API for `mai` across Rust, wasm JSON, and TypeScript/Vue packages.

If a symbol or file is not listed here, treat it as internal and changeable without notice.

## Rust Crate: `mai`

Source of exported surface: `core/src/lib.rs`.

Public modules:
- `adapters`
- `application`
- `commands`
- `domain`
- `layout`

Public re-exports:
- application:
  - `ActorLookup`
  - `BusinessRuleError`
  - `CommandResult`
  - `ReferentialError`
  - `SchedulerError`
  - `SchedulerService`
  - `StructuralError`
- commands:
  - `AddAppointmentCommand`
  - `AddSlotCommand`
  - `CancelAppointmentCommand`
  - `CancelSlotCommand`
  - `DeleteAppointmentCommand`
  - `DeleteSlotCommand`
  - `RescheduleSlotCommand`
- domain:
  - `ActorId`
  - `ActorRef`
  - `Appointment`
  - `AppointmentId`
  - `Slot`
  - `SlotId`
  - `SlotStatus`
  - `TimeRange`
  - `TimeRangeError`
  - `WeekRange`
  - `WeekRangeError`
- layout:
  - `AppointmentLayoutNode`
  - `CalendarOwnerFilter`
  - `SlotLayoutNode`
  - `WeeklyLayout`
  - `WeeklyLayoutQuery`
- state:
  - `ScheduleState`

## Wasm Adapter Contract

Primary source:
- `core/src/adapters/wasm/types.rs`
- `core/src/adapters/wasm/adapter.rs`
- `core/src/adapters/wasm/bindgen.rs`

JSON envelope requests:
- command envelope: `WasmCommandRequest`
  - tags:
    - `add_slot`
    - `delete_slot`
    - `cancel_slot`
    - `add_appointment`
    - `cancel_appointment`
    - `delete_appointment`
    - `reschedule_slot`
- query envelope: `WasmQueryRequest`
  - tags:
    - `weekly_layout`

Payload DTOs:
- `WasmAddSlotPayload`
- `WasmDeleteSlotPayload`
- `WasmCancelSlotPayload`
- `WasmAddAppointmentPayload`
- `WasmCancelAppointmentPayload`
- `WasmDeleteAppointmentPayload`
- `WasmRescheduleSlotPayload`
- `WasmWeeklyLayoutQuery`
- `WasmViewFilter`
- `WasmViewFilterMode` (`all`, `none`, `owners`, `group`)

Response envelopes:
- `WasmResponse<T>`
- `WasmCommandResponse` (`WasmMutationSuccess`)
- `WasmQueryResponse` (`WeeklyLayout`)
- `WasmMutationSuccess` (`applied`)

Error contract:
- `WasmAdapterError`
- `WasmErrorCategory`:
  - `structural`
  - `referential`
  - `business`
  - `contract`

Wasm bindgen entrypoints:
- `WasmBindgenAdapter::new()`
- `execute_command_json(&str) -> String`
- `execute_query_json(&str) -> String`

## TypeScript: `@mai/mai-web-core`

Entry source:
- `web/packages/mai-web-core/src/index.ts`

Public runtime exports:
- `COMMANDS`
- `QUERIES`
- `buildAppointmentTitle`
- `createBookSlotCommand`
- `createCommandEnvelope`
- `createQueryEnvelope`
- `executeCommand`
- `executeWeeklyLayoutQuery`
- `parseJsonResponse`

Public type exports:
- JSON/error/layout:
  - `WasmErrorCategory`
  - `WasmAdapterError`
  - `WasmResponse`
  - `WeeklyLayout`
  - `SlotLayoutNode`
  - `AppointmentLayoutNode`
- query filter/query payload:
  - `WeeklyViewFilterMode`
  - `WeeklyViewFilter`
  - `WeeklyLayoutQueryPayload`
- command/query names and payload maps:
  - `CommandName`
  - `CommandPayloadMap`
  - `QueryName`
  - `QueryPayloadMap`
- envelopes:
  - `CommandEnvelope`
  - `TypedCommandEnvelope`
  - `AnyCommandEnvelope`
  - `QueryEnvelope`
  - `TypedQueryEnvelope`
- command payload DTOs:
  - `AddSlotCommandPayload`
  - `RescheduleSlotCommandPayload`
  - `DeleteSlotCommandPayload`
  - `CancelSlotCommandPayload`
  - `AddAppointmentCommandPayload`
  - `CancelAppointmentCommandPayload`
  - `DeleteAppointmentCommandPayload`
- booking helper inputs:
  - `BuildAppointmentTitleInput`
  - `BookSlotCommandInput`
- adapter interface type:
  - `JsonAdapter`

## TypeScript: `@mai/mai-wasm-adapter`

Entry source:
- `web/packages/mai-wasm-adapter/src/index.ts`

Public runtime exports:
- `createWasmAdapter(options?)`

Public types:
- `WasmAdapterFactoryOptions`

Contract note:
- callers should depend on `JsonAdapter` behavior through `@mai/mai-web-core`.
- direct `core/pkg/*` imports are internal build details, not app API.

## Vue UI: `@mai/mai-ui-vue`

Entry sources:
- `web/packages/mai-ui-vue/src/index.ts`
- `web/packages/mai-ui-vue/src/types.ts`

Public components:
- `MaiBoard`
- `MaiBoardInteractive`
- `MaiBookingFlow`
- `MaiCalendarFilterToolbar`
- booking UI fragments:
  - `MaiAvailabilityPicker`
  - `MaiBookingAuthGate`
  - `MaiBookingConfirmCard`
  - `MaiCategoryPicker`
  - `MaiLocationPicker`
  - `MaiResourcePicker`
- interactive action cards:
  - `MaiAppointmentActionsCard`
  - `MaiCreateSlotCard`
  - `MaiSlotActionsCard`

Public helpers:
- `useMai`
- `createNuxtMaiState`

Public event constants:
- `MAI_BOOKING_FLOW_EVENTS`
- `MAI_BOARD_INTERACTIVE_EVENTS`
- `INTERACTION_ACTIONS`
- `INTERACTION_SUCCESS_EVENTS`

Public type families:
- board interaction event payloads
- action payloads
- interactive board actor/action/view configs
- booking flow entities, state, config, payloads, and errors
- view filter option/owner option types

Component prop/emits contract sources:
- booking flow: `web/packages/mai-ui-vue/src/features/booking/MaiBookingFlow.tsx`
- interactive board: `web/packages/mai-ui-vue/src/features/interactive-board/MaiBoardInteractive.tsx`
- board: `web/packages/mai-ui-vue/src/features/board/MaiBoard.tsx`

## Stable Error Codes

Canonical mapping source:
- `core/src/adapters/wasm/error_mapping.rs`

Consumer docs:
- `docs/adapter_error_codes.md`

Coverage:
- `core/tests/serialization_contract.rs`

## Existing Contract Docs

- payload examples: `docs/adapter_payload_examples.md`
- wasm usage: `docs/wasm_adapter_usage.md`
- error codes: `docs/adapter_error_codes.md`
- verification matrix: `docs/verification_matrix.md`
