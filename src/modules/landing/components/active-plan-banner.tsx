"use client";

import { Button } from "@/components/ui/button";
import { SubscriptionPlanSelect } from "@/components/subscription/subscription-plan-select";
import type { SelectSubscription } from "@/lib/drizzle/schema";

export function ActivePlanBanner({
  subscription,
}: {
  subscription: SelectSubscription | null;
}) {
  const planName = subscription?.plan
    ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)
    : "Free";

  const isUpgradeable = !subscription || subscription.plan === "free";

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between rounded-xl border border-border bg-muted px-5 py-4">
        <div>
          <p className="text-sm font-medium">Your current plan</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            You&apos;re on the{" "}
            <span className="font-semibold text-foreground">{planName}</span>{" "}
            plan.{" "}
            {isUpgradeable
              ? "Upgrade anytime — no hidden fees."
              : "Manage your subscription below."}
          </p>
        </div>
        {isUpgradeable && <Button size="sm">Upgrade</Button>}
      </div>

      <SubscriptionPlanSelect subscription={subscription} />
    </div>
  );
}
