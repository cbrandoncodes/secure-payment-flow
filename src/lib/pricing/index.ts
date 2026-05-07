import { PricingPlan } from "@/types/pricing";

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    prices: {
      monthly: 0,
      annually: 0,
    },
    description: "Get started for free.",
    features: ["Access to free features"],
  },
  {
    id: "pro",
    name: "Pro",
    prices: {
      monthly: 29,
      annually: 23,
    },
    description: "For growing teams.",
    features: ["Everything in Free", "Access to pro features"],
    highlighted: true,
    badge: "Most Popular",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    prices: {
      monthly: 99,
      annually: 79,
    },
    description: "For large organizations.",
    features: ["Everything in Pro", "Access to enterprise features"],
  },
];
