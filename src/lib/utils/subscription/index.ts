import { SubscriptionPlan, SubscriptionStatus } from "@/types/subscription";

export const GRACE_PERIOD_DAYS = 3;

export const FREE_TRIAL_PERIOD_DAYS = 3;

export const timelineProductToPlanMap: Record<
  "monthly" | "annually",
  Record<string, SubscriptionPlan>
> = {
  monthly: {
    [process.env.PRO_MONTHLY_PRODUCT_ID!]: "pro",
    [process.env.ENTERPRISE_MONTHLY_PRODUCT_ID!]: "enterprise",
  },
  annually: {
    [process.env.PRO_ANNUALLY_PRODUCT_ID!]: "pro",
    [process.env.ENTERPRISE_ANNUALLY_PRODUCT_ID!]: "enterprise",
  },
};

export const baseProductToPlanMap: Record<string, SubscriptionPlan> = {
  ...timelineProductToPlanMap.monthly,
  ...timelineProductToPlanMap.annually,
};

export function getTimelineFromProductId(productId?: string) {
  if (!productId) return undefined;

  if (productId in timelineProductToPlanMap.monthly) {
    return "monthly";
  }

  if (productId in timelineProductToPlanMap.annually) {
    return "annually";
  }

  return undefined;
}

export const subscriptionStatusLabelMap: Record<SubscriptionStatus, string> = {
  active: "Active",
  cancelled: "Cancelled",
  failed: "Failed",
  expired: "Expired",
  pending: "Pending",
  on_hold: "On Hold",
};
