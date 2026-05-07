export type BillingInterval = "monthly" | "annually";

export type PricingPlan = {
  id: string;
  name: string;
  prices: {
    monthly: number;
    annually: number;
  };
  description: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
};
