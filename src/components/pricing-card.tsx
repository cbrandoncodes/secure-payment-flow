import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { PricingPlan } from "@/types/pricing";

export function PricingCard({
  plan,
  isCurrentPlan,
}: {
  plan: PricingPlan;
  isCurrentPlan?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-5 rounded-xl border p-6",
        plan.highlighted
          ? "border-primary bg-primary text-primary-foreground shadow-lg"
          : "border-border bg-card text-card-foreground",
      )}
    >
      {plan.badge && (
        <span
          className={cn(
            "absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-xs font-semibold",
            plan.highlighted
              ? "bg-primary-foreground text-primary"
              : "bg-primary text-primary-foreground",
          )}
        >
          {plan.badge}
        </span>
      )}
      {isCurrentPlan && !plan.highlighted && (
        <span className="absolute -top-3 right-4 rounded-full bg-muted px-3 py-0.5 text-xs font-medium text-muted-foreground">
          Current plan
        </span>
      )}
      <div className="space-y-1">
        <h3 className="text-lg font-bold">{plan.name}</h3>
        <p
          className={cn(
            "text-sm",
            plan.highlighted
              ? "text-primary-foreground/80"
              : "text-muted-foreground",
          )}
        >
          {plan.description}
        </p>
      </div>
      <div className="flex items-end gap-1">
        <span className="text-4xl font-extrabold">${plan.price}</span>
        <span
          className={cn(
            "mb-1 text-sm",
            plan.highlighted
              ? "text-primary-foreground/70"
              : "text-muted-foreground",
          )}
        >
          / month
        </span>
      </div>
      <ul className="flex-1 space-y-2.5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-center gap-2.5 text-sm">
            <Check
              className={cn(
                "size-4 shrink-0",
                plan.highlighted ? "text-primary-foreground" : "text-primary",
              )}
            />
            {feature}
          </li>
        ))}
      </ul>
      <Button
        variant={plan.highlighted ? "secondary" : "outline"}
        className="w-full"
        disabled={isCurrentPlan}
      >
        {isCurrentPlan
          ? "Current plan"
          : plan.price === 0
            ? "Get started"
            : `Upgrade to ${plan.name}`}
      </Button>
    </div>
  );
}
