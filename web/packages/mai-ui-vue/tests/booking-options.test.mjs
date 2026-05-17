import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { MaiCategoryPicker } from "../dist/features/booking/ui/MaiCategoryPicker.js";
import { MaiLocationPicker } from "../dist/features/booking/ui/MaiLocationPicker.js";
import { MaiResourcePicker } from "../dist/features/booking/ui/MaiResourcePicker.js";
import { eligibleResourcesForCategory } from "../dist/features/booking/model/options.js";

const distStyles = readFileSync(
  new URL("../dist/styles.css", import.meta.url),
  "utf8"
);

test("booking option pickers expose deterministic event contracts", () => {
  assert.equal(MaiCategoryPicker.name, "MaiCategoryPicker");
  assert.equal(MaiLocationPicker.name, "MaiLocationPicker");
  assert.equal(MaiResourcePicker.name, "MaiResourcePicker");
  assert.equal(
    MaiCategoryPicker.emits.categorySelected("category-1"),
    true
  );
  assert.equal(MaiCategoryPicker.emits.categorySelected(""), false);
  assert.equal(MaiLocationPicker.emits.locationSelected(""), false);
  assert.equal(MaiLocationPicker.emits.locationSelected("location-1"), true);
  assert.equal(MaiResourcePicker.emits.resourceSelected(null), true);
  assert.equal(MaiResourcePicker.emits.resourceSelected("resource-1"), true);
});

test("eligibleResourcesForCategory returns only matching resources", () => {
  const resources = [
    {
      resourceId: "resource-1",
      label: "Resource One",
      categoryIds: ["category-a"],
      resourceOwnerId: "owner-1",
    },
    {
      resourceId: "resource-2",
      label: "Resource Two",
      categoryIds: ["category-b"],
      resourceOwnerId: "owner-2",
    },
  ];

  assert.deepEqual(
    eligibleResourcesForCategory(resources, "category-a").map(
      (resource) => resource.resourceId
    ),
    ["resource-1"]
  );
  assert.deepEqual(eligibleResourcesForCategory(resources, null), []);
});

test("booking option styles use design tokens and avoid gradients", () => {
  assert.match(distStyles, /\.mai-booking-option/);
  assert.match(distStyles, /var\(--color-border\)/);
  assert.match(distStyles, /var\(--radius-md\)/);
  assert.match(distStyles, /focus-visible/);
  assert.doesNotMatch(distStyles, /gradient/i);
});
