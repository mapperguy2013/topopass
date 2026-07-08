export type DevToolCard = {
  title: string;
  href: string;
  description: string;
  status: "available" | "internal-gated";
};

export type DevToolsHomeModel = {
  path: "/dev";
  title: "TOPOPASS Dev Tools";
  devOnlyNotice: string;
  cards: DevToolCard[];
  linkedFromLearnerNavigation: false;
};

export function buildDevToolsHomeModel(): DevToolsHomeModel {
  return {
    path: "/dev",
    title: "TOPOPASS Dev Tools",
    devOnlyNotice:
      "Development and admin QA tools only. These routes are intentionally not linked from normal learner navigation.",
    linkedFromLearnerNavigation: false,
    cards: [
      {
        title: "Route Runner",
        href: "/dev/route-runner",
        description: "Inspect maps, draw route attempts, review legality, debug overlays, and test Training Mode.",
        status: "available"
      },
      {
        title: "Training Route Author",
        href: "/dev/training-route",
        description: "Prepare, validate, preview, and export curated learner-driver training routes for Stage 19.",
        status: "available"
      },
      {
        title: "Beta Feedback Review",
        href: "/dev/beta-feedback",
        description: "Review stored Real London beta feedback when the internal review flag is enabled.",
        status: "internal-gated"
      },
      {
        title: "Beta Attempt Review",
        href: "/dev/beta-attempts",
        description: "Review stored Real London beta attempts and export deterministic repro payloads.",
        status: "internal-gated"
      }
    ]
  };
}
