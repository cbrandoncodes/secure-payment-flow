import { PricingPlan } from "@/types/pricing";

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    interval: "month",
    description: "Get started for free.",
    features: ["Access to free features"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 29,
    interval: "month",
    description: "For growing teams.",
    features: ["Everything in Free", "Access to pro features"],
    highlighted: true,
    badge: "Most Popular",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 99,
    interval: "month",
    description: "For large organizations.",
    features: ["Everything in Pro", "Access to enterprise features"],
  },
];
