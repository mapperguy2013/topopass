export type PlanId = "free" | "plus" | "pro";

export type PlanAvailability = "available" | "coming-soon";

export type PlanDefinition = {
  id: PlanId;
  label: string;
  badge: string;
  availability: PlanAvailability;
  priceLabel: string;
  description: string;
  included: string[];
  comingSoon: string[];
  ctaLabel: string;
  ctaHref: string;
};

export const defaultPlanId: PlanId = "free";

export const planDefinitions: PlanDefinition[] = [
  {
    id: "free",
    label: "Free plan",
    badge: "Available now",
    availability: "available",
    priceLabel: "GBP 0",
    description:
      "Start practising with core Topographical and SERU-style learning tools before paid upgrades are available.",
    included: [
      "Limited practice access",
      "Basic progress",
      "Topographical and SERU-style starter content",
      "Browser-local signed-out progress"
    ],
    comingSoon: ["More questions", "Advanced insights", "Cross-device progress"],
    ctaLabel: "Continue with free practice",
    ctaHref: "/practice"
  },
  {
    id: "plus",
    label: "Plus plan",
    badge: "Coming soon",
    availability: "coming-soon",
    priceLabel: "Coming soon",
    description:
      "Planned upgrade for learners who want a fuller guided course across Topographical and SERU preparation.",
    included: [
      "More practice questions",
      "SERU-style practice",
      "Mock exams",
      "Weak-topic review"
    ],
    comingSoon: ["Full progress insights", "Future cross-device progress"],
    ctaLabel: "Register interest",
    ctaHref: "/pricing"
  },
  {
    id: "pro",
    label: "Pro plan",
    badge: "Coming soon",
    availability: "coming-soon",
    priceLabel: "Coming soon",
    description:
      "Future plan for deeper preparation support after beta pricing, access rules, and learner support policies are settled.",
    included: [
      "Expanded mock exam support",
      "Deeper progress review",
      "Larger content expansion",
      "Priority beta feedback options"
    ],
    comingSoon: ["Advanced analytics", "Additional content packs"],
    ctaLabel: "Join upgrade waitlist",
    ctaHref: "/pricing"
  }
];

export function getPlanDefinition(planId: PlanId = defaultPlanId) {
  return (
    planDefinitions.find((plan) => plan.id === planId) ??
    planDefinitions.find((plan) => plan.id === defaultPlanId)!
  );
}

export function isPaidPlanPlaceholder(planId: PlanId) {
  return getPlanDefinition(planId).availability === "coming-soon";
}
