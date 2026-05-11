"use client";

import { useState } from "react";
import { PricingCard } from "@/components/pricing-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PRICING_PLANS } from "@/lib/pricing";
import type { SelectSubscription } from "@/lib/drizzle/schema";
import type { BillingInterval } from "@/types/pricing";

type Props = {
  subscription?: SelectSubscription | null;
  onPlanAction?: (planId: string, interval: BillingInterval) => void;
};

export function SubscriptionPlanSelect({ subscription, onPlanAction }: Props) {
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("monthly");

  const currentPlanId = subscription?.plan ?? "free";
  const currentTimeline = subscription?.timeline ?? null;

  const purchasablePlans = PRICING_PLANS.filter((plan) => plan.id !== "free");

  return (
    <div className="space-y-8">
      <div className="text-center">
        <Tabs
          value={billingInterval}
          onValueChange={(v) => setBillingInterval(v as BillingInterval)}
          className="items-center"
        >
          <TabsList variant="pill">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="annually">Annually</TabsTrigger>
          </TabsList>
        </Tabs>
        {currentTimeline && currentTimeline !== billingInterval && (
          <p className="mt-3 text-xs text-muted-foreground">
            Your current billing cycle is {currentTimeline}. Switching takes
            effect at your next billing date.
          </p>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {purchasablePlans.map((plan) => {
          const isCurrentPlan =
            currentPlanId === plan.id && currentTimeline === billingInterval;

          return (
            <PricingCard
              key={plan.id}
              plan={plan}
              billingInterval={billingInterval}
              isCurrentPlan={isCurrentPlan}
              onAction={
                isCurrentPlan
                  ? undefined
                  : () => onPlanAction?.(plan.id, billingInterval)
              }
            />
          );
        })}
      </div>
    </div>
  );
}

