"use client";

import { useState } from "react";
import { trackEvent, type AnalyticsEventProperties } from "@/lib/analytics/events";

type UpgradeInterestButtonProps = {
  analyticsProperties: AnalyticsEventProperties;
  className?: string;
  label?: string;
};

export function UpgradeInterestButton({
  analyticsProperties,
  className,
  label = "Register interest"
}: UpgradeInterestButtonProps) {
  const [hasRegisteredInterest, setHasRegisteredInterest] = useState(false);

  function handleClick() {
    trackEvent("plan_selected", analyticsProperties);
    trackEvent("upgrade_interest_clicked", analyticsProperties);
    setHasRegisteredInterest(true);
  }

  return (
    <div>
      <button
        className={className}
        onClick={handleClick}
        type="button"
      >
        {label}
      </button>
      {hasRegisteredInterest && (
        <p className="mt-3 rounded-md border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-800">
          Thanks. Upgrade interest has been noted for beta planning. No payment
          has been taken.
        </p>
      )}
    </div>
  );
}
