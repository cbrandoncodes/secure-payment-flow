import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { BillingInterval, PricingPlan } from "@/types/pricing";

export function PricingCard({
  plan,
  billingInterval,
  isCurrentPlan,
}: {
  plan: PricingPlan;
  billingInterval: BillingInterval;
  isCurrentPlan?: boolean;
}) {
  const price = plan.prices[billingInterval];
  const savingsPct =
    billingInterval === "annually" && plan.prices.monthly > 0
      ? Math.round(
          ((plan.prices.monthly - plan.prices.annually) / plan.prices.monthly) *
            100,
        )
      : null;

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
      <div className="flex flex-col gap-1">
        <div className="flex items-end gap-1">
          {billingInterval === "annually" && price > 0 ? (
            <span className="text-4xl font-extrabold">${price * 12}</span>
          ) : (
            <span className="text-4xl font-extrabold">${price}</span>
          )}
          <div
            className={cn(
              "mb-1 flex flex-col text-sm leading-tight",
              plan.highlighted
                ? "text-primary-foreground/70"
                : "text-muted-foreground",
            )}
          >
            {billingInterval === "annually" && price > 0 ? (
              <span>/ year</span>
            ) : (
              <span>/ month</span>
            )}
          </div>
          {savingsPct !== null && (
            <span
              className={cn(
                "mb-1 ml-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                plan.highlighted
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-green-100 text-green-700",
              )}
            >
              Save {savingsPct}%
            </span>
          )}
        </div>
        {billingInterval === "annually" && price > 0 && (
          <p
            className={cn(
              "text-xs",
              plan.highlighted
                ? "text-primary-foreground/60"
                : "text-muted-foreground",
            )}
          >
            ${price} / month
          </p>
        )}
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
          : price === 0
            ? "Get started"
            : `Upgrade to ${plan.name}`}
      </Button>
    </div>
  );
}
