export const analyticsEventNames = [
  "home_cta_click",
  "practice_start_click",
  "mock_exam_start_click",
  "pricing_cta_click",
  "signup_intent_click",
  "pricing_viewed",
  "plan_selected",
  "free_practice_continued",
  "upgrade_interest_clicked",
  "account_upgrade_cta_clicked",
  "newsletter_signup_started",
  "newsletter_signup_submitted",
  "newsletter_signup_success",
  "newsletter_signup_error"
] as const;

export type AnalyticsEventName = (typeof analyticsEventNames)[number];

export type AnalyticsEventProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

type AnalyticsProvider = {
  track?: (
    name: AnalyticsEventName,
    properties: Record<string, string | number | boolean>
  ) => void;
};

declare global {
  interface Window {
    topopassAnalytics?: AnalyticsProvider;
  }
}

const allowedEventNames = new Set<string>(analyticsEventNames);
const blockedPropertyKeyPatterns = [
  /answer/i,
  /cookie/i,
  /email/i,
  /password/i,
  /payload/i,
  /session/i,
  /token/i,
  /user/i
];

export function isAnalyticsEventName(
  name: string
): name is AnalyticsEventName {
  return allowedEventNames.has(name);
}

export function sanitizeAnalyticsProperties(
  properties: AnalyticsEventProperties = {}
) {
  const safeProperties: Record<string, string | number | boolean> = {};

  Object.entries(properties).forEach(([key, value]) => {
    if (
      blockedPropertyKeyPatterns.some((pattern) => pattern.test(key)) ||
      value === null ||
      value === undefined
    ) {
      return;
    }

    if (typeof value === "string") {
      safeProperties[key] = value.slice(0, 120);
      return;
    }

    if (typeof value === "number") {
      if (Number.isFinite(value)) {
        safeProperties[key] = value;
      }
      return;
    }

    if (typeof value === "boolean") {
      safeProperties[key] = value;
    }
  });

  return safeProperties;
}

export function trackEvent(
  name: AnalyticsEventName,
  properties: AnalyticsEventProperties = {}
) {
  if (!isAnalyticsEventName(name)) {
    return;
  }

  const safeProperties = sanitizeAnalyticsProperties(properties);

  if (typeof window === "undefined") {
    return;
  }

  window.topopassAnalytics?.track?.(name, safeProperties);
}
