# @mai/mai-web-core

Framework-agnostic TypeScript contracts and JSON envelope helpers for the `mai` scheduling core.

## Weekly layout query filter contract

`WeeklyViewFilter` supports four canonical modes:

```ts
type WeeklyViewFilter =
  | { mode: "all" }
  | { mode: "none" }
  | { mode: "owners" | "group"; ids: string[] };
```

Semantics:
- `all`: no resource-owner filtering.
- `none`: explicit empty selection (returns no slots/appointments).
- `owners`: include only listed resource owners.
- `group`: boundary-level grouping mode; IDs must already be resolved by the consuming app.

For `owners`/`group`, an empty `ids` array is deterministic and treated as "none selected" by the core boundary.

## Examples

```ts
import {
  QUERIES,
  createQueryEnvelope,
  executeWeeklyLayoutQuery,
  type WeeklyViewFilter,
} from "@mai/mai-web-core";

const filter: WeeklyViewFilter = { mode: "owners", ids: ["owner-42"] };

const query = createQueryEnvelope(QUERIES.WEEKLY_LAYOUT, {
  anchor_date: "2026-05-07",
  view_filter: filter,
});

const result = executeWeeklyLayoutQuery(adapter, query.payload);
```

Clinical app note:
- specialty/doctor/location filters should be mapped to `resource_owner_id` sets before invoking `weekly_layout`.
