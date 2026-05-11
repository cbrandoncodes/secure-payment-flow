import { Button } from "@/components/ui/button";

export function ActivePlanBanner({ planName }: { planName: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-muted px-5 py-4">
      <div>
        <p className="text-sm font-medium">Your current plan</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          You&apos;re on the{" "}
          <span className="font-semibold text-foreground">{planName}</span>{" "}
          plan. Upgrade anytime — no hidden fees.
        </p>
      </div>
      <Button size="sm">Upgrade</Button>
    </div>
  );
}
