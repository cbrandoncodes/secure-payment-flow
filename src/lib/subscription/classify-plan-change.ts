import { PlanChangeType } from "@/types/subscription";

export const planRank: Record<string, number> = {
  free: 0,
  pro: 1,
  career: 2,
};

export function classifyPlanChange({
  currentPlan,
  newPlan,
  currentProductId,
  newProductId,
}: {
  currentPlan: string;
  newPlan: string;
  currentProductId: string | null | undefined;
  newProductId: string;
}): PlanChangeType {
  const currentRank = planRank[currentPlan] ?? 0;
  const newRank = planRank[newPlan] ?? 0;

  if (currentProductId === newProductId) {
    return "same";
  }

  if (newRank > currentRank) {
    return "upgrade";
  }

  if (newRank < currentRank) {
    return "downgrade";
  }

  // same plan tier, different product (different billing cycle)
  return "cycle-change";
}
