import assert from "node:assert/strict";
import test from "node:test";

import {
  getFeatureAccess,
  getPlanEntitlements,
  getUpgradeCtaForFeature
} from "./entitlements.ts";
import {
  defaultPlanId,
  getPlanDefinition,
  isPaidPlanPlaceholder,
  planDefinitions
} from "./plans.ts";

test("plan definitions expose free plus and pro without live payments", () => {
  assert.deepEqual(
    planDefinitions.map((plan) => plan.id),
    ["free", "plus", "pro"]
  );
  assert.equal(defaultPlanId, "free");
  assert.equal(getPlanDefinition("free").availability, "available");
  assert.equal(isPaidPlanPlaceholder("plus"), true);
  assert.equal(isPaidPlanPlaceholder("pro"), true);

  for (const plan of planDefinitions) {
    assert.doesNotMatch(plan.description, /stripe|checkout|guaranteed pass/i);
    assert.doesNotMatch(plan.label, /official|TfL-approved/i);
  }
});

test("free entitlements keep current learner access and mark upgrades as coming soon", () => {
  assert.equal(getFeatureAccess("topographical-practice").access, "included");
  assert.equal(getFeatureAccess("topographical-mock-exams").access, "included");
  assert.equal(getFeatureAccess("basic-progress").access, "included");
  assert.equal(getFeatureAccess("seru-practice").access, "preview");
  assert.equal(getFeatureAccess("advanced-progress-insights").access, "coming-soon");
  assert.equal(getFeatureAccess("expanded-question-bank").access, "coming-soon");
});

test("upgrade copy is explicit and does not imply active billing", () => {
  assert.equal(
    getUpgradeCtaForFeature("advanced-progress-insights"),
    "Upgrade coming soon"
  );
  assert.equal(
    getUpgradeCtaForFeature("expanded-question-bank"),
    "More questions coming soon"
  );
  assert.equal(getPlanEntitlements("free").length >= 6, true);
});
