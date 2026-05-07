export type PricingPlan = {
  id: string;
  name: string;
  price: number;
  interval: "month";
  description: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
};
