import {
  planTypeEnum,
  subscriptionStatusEnum,
  subscriptionTimelineEnum,
} from "@/lib/drizzle/schema";

export type SubscriptionPlan = (typeof planTypeEnum)["enumValues"][number];

export type SubscriptionTimeline =
  (typeof subscriptionTimelineEnum)["enumValues"][number];

export type SubscriptionStatus =
  (typeof subscriptionStatusEnum.enumValues)[number];

export type DowngradeUsageViolation = {
  resource: "researches" | "drafts" | "proofs";
  current: number;
  limit: number;
};

export type PlanChangeType = "same" | "upgrade" | "downgrade" | "cycle-change";
