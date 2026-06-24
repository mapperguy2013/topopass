import {
  defaultPlanId,
  getPlanDefinition,
  type PlanId
} from "./plans.ts";

export type FeatureKey =
  | "topographical-practice"
  | "seru-practice"
  | "topographical-mock-exams"
  | "basic-progress"
  | "advanced-progress-insights"
  | "expanded-question-bank"
  | "cross-device-progress";

export type FeatureAccess = {
  key: FeatureKey;
  label: string;
  access: "included" | "preview" | "coming-soon";
  upgradeCta: string | null;
};

const freeFeatureAccess: Record<FeatureKey, FeatureAccess> = {
  "topographical-practice": {
    key: "topographical-practice",
    label: "Topographical practice",
    access: "included",
    upgradeCta: null
  },
  "seru-practice": {
    key: "seru-practice",
    label: "SERU-style practice",
    access: "preview",
    upgradeCta: "More SERU practice coming soon"
  },
  "topographical-mock-exams": {
    key: "topographical-mock-exams",
    label: "Topographical mock exams",
    access: "included",
    upgradeCta: null
  },
  "basic-progress": {
    key: "basic-progress",
    label: "Basic progress",
    access: "included",
    upgradeCta: null
  },
  "advanced-progress-insights": {
    key: "advanced-progress-insights",
    label: "Advanced progress insights",
    access: "coming-soon",
    upgradeCta: "Upgrade coming soon"
  },
  "expanded-question-bank": {
    key: "expanded-question-bank",
    label: "Expanded question bank",
    access: "coming-soon",
    upgradeCta: "More questions coming soon"
  },
  "cross-device-progress": {
    key: "cross-device-progress",
    label: "Cross-device progress",
    access: "coming-soon",
    upgradeCta: "Future account syncing planned"
  }
};

export function getCurrentLearnerPlan(): PlanId {
  return defaultPlanId;
}

export function getFeatureAccess(featureKey: FeatureKey, planId: PlanId = defaultPlanId) {
  if (planId === "free") {
    return freeFeatureAccess[featureKey];
  }

  const baseAccess = freeFeatureAccess[featureKey];
  const plan = getPlanDefinition(planId);

  if (plan.availability === "coming-soon") {
    return {
      ...baseAccess,
      access:
        baseAccess.access === "included" ? baseAccess.access : "coming-soon",
      upgradeCta: "Upgrade coming soon"
    } satisfies FeatureAccess;
  }

  return baseAccess;
}

export function getPlanEntitlements(planId: PlanId = defaultPlanId) {
  return Object.keys(freeFeatureAccess).map((key) =>
    getFeatureAccess(key as FeatureKey, planId)
  );
}

export function getUpgradeCtaForFeature(featureKey: FeatureKey) {
  return getFeatureAccess(featureKey).upgradeCta ?? "Included in your plan";
}
