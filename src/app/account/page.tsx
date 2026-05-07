import { Check, LayoutDashboard, TrendingUp, XCircle } from "lucide-react";
import type { Metadata } from "next";
import { AccountActionCard } from "@/modules/account/components/account-action-card";
import { PRICING_PLANS } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Account",
  description: "Manage your subscription and billing details.",
};

export default function AccountPage() {
  const currentPlan = PRICING_PLANS.find((p) => p.id === "free")!;

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Account</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your subscription and billing details.
          </p>
        </div>

        {/* Current plan */}
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Current plan
          </h2>
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">{currentPlan.name}</span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    Active
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {currentPlan.description}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Next billing date:{" "}
                  <span className="font-medium text-foreground">
                    June 6, 2026
                  </span>
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-3xl font-extrabold">
                  ${currentPlan.price}
                  <span className="text-sm font-normal text-muted-foreground">
                    /mo
                  </span>
                </p>
              </div>
            </div>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {currentPlan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <Check className="size-4 shrink-0 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Actions */}
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Actions
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <AccountActionCard
              icon={TrendingUp}
              title="Upgrade plan"
              description="Move to Pro or Enterprise for higher limits."
              actionLabel="Upgrade to Pro"
              variant="default"
            />
            <AccountActionCard
              icon={LayoutDashboard}
              title="Manage billing"
              description="Update payment methods and download receipts."
              actionLabel="Open billing portal"
            />
            <AccountActionCard
              icon={XCircle}
              title="Cancel subscription"
              description="Cancel anytime. Active until period ends."
              actionLabel="Cancel"
              destructive
            />
          </div>
        </section>
      </div>
    </main>
  );
}
