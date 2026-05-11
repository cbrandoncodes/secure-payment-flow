"server-only";

import { getSubscription } from "@/lib/drizzle/queries/subscriptions";
import { PlanChangeType } from "@/types/subscription";
import {
  DowngradeUsageViolation,
  SubscriptionPlan,
  SubscriptionTimeline,
} from "@/types/subscription";

export async function validateDowngradeUsage({
  userId,
  targetPlan,
  changeType,
}: {
  userId: string;
  targetPlan: SubscriptionPlan;
  targetTimeline: SubscriptionTimeline;
  changeType: PlanChangeType;
}): Promise<
  | { ok: true }
  | {
      ok: false;
      code: "DOWNGRADE_USAGE_LIMIT_EXCEEDED";
      message: string;
      usage: { feature: number };
      limits: { feature: number };
      violations: DowngradeUsageViolation[];
    }
> {
  if (changeType !== "downgrade") {
    return { ok: true };
  }

  const subscription = await getSubscription({ userId });

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  // get limits and add usage checks

  const violations: DowngradeUsageViolation[] = [];

  const planName = targetPlan.charAt(0).toUpperCase() + targetPlan.slice(1);

  const message = `Cannot switch to ${planName} right now. Your current usage exceeds the ${planName} plan limits. Remove the extra usage first, then retry.`;

  const limitsExceeded = false; // replace with actual check against limits

  return limitsExceeded
    ? {
        ok: false,
        code: "DOWNGRADE_USAGE_LIMIT_EXCEEDED",
        message,
        usage: {
          feature: 5, // replace with actual usage data
        },
        limits: {
          feature: 3, // replace with actual plan limits
        },
        violations,
      }
    : { ok: true };
}
