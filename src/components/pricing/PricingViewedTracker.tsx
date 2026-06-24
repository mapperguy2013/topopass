"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/events";

export function PricingViewedTracker() {
  useEffect(() => {
    trackEvent("pricing_viewed", {
      route: "/pricing",
      paymentStatus: "not-live"
    });
  }, []);

  return null;
}
