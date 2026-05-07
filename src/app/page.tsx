"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PricingCard } from "@/components/pricing-card";
import { PRICING_PLANS } from "@/lib/pricing";
import type { BillingInterval } from "@/types/pricing";

export default function HomePage() {
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("monthly");

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-5xl px-4 py-20 text-center">
        <h1 className="mt-4 text-5xl font-extrabold tracking-tight">
          Payments done&nbsp;<span className="text-primary">securely</span>.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          A practical example of secure recurring payment integration for SaaS
          applications using Next.js, Dodo Payments, and Better Auth.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-6">
        <div className="flex items-center justify-between rounded-xl border border-border bg-muted px-5 py-4">
          <div>
            <p className="text-sm font-medium">Your current plan</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              You&apos;re on the{" "}
              <span className="font-semibold text-foreground">Free</span> plan.
              Upgrade anytime — no hidden fees.
            </p>
          </div>
          <Button size="sm">Upgrade</Button>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold">Simple, transparent pricing</h2>
          <p className="mt-2 text-muted-foreground">
            Choose the plan that works for you.
          </p>
          <Tabs
            value={billingInterval}
            onValueChange={(v) => setBillingInterval(v as BillingInterval)}
            className="mt-6 items-center"
          >
            <TabsList variant="pill">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="annually">Annually</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {PRICING_PLANS.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              billingInterval={billingInterval}
              isCurrentPlan={plan.id === "free"}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
