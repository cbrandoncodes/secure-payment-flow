"use client";

import React, { useEffect, useState } from "react";
import { TriangleAlertIcon, InfoIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SubscriptionPlanSelect from "./subscription-plan-select";
import { SelectSubscription } from "@/lib/drizzle/schema";
import { SubscriptionPlan } from "@/types/subscription";
import { useSubscription } from "@/hooks/use-subscription";

type Props = {
  subscription?: SelectSubscription | null;
  children?: React.ReactNode;
  initialPlan?: SubscriptionPlan | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubscriptionChanged?: () => void;
};

export default function Subscription({
  subscription,
  children,
  initialPlan,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSubscriptionChanged,
}: Props) {
  const activePlan =
    subscription?.status === "active" ? subscription.plan : null;

  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const {
    timeline,
    setTimeline,
    selectedPlan,
    setSelectedPlan,
    processingPlan,
    handleSubscription,
    resetState,
    isProcessing,
  } = useSubscription({
    activePlan,
    onSuccess: () => {
      if (controlledOnOpenChange) {
        controlledOnOpenChange(false);
      } else {
        setInternalOpen(false);
      }
      onSubscriptionChanged?.();
    },
  });

  useEffect(() => {
    if (initialPlan) setSelectedPlan(initialPlan);
  }, [initialPlan, setSelectedPlan]);

  const pendingTimeline: "monthly" | "annually" | null =
    subscription?.pendingTimeline ?? null;

  function handleOpenChange(open: boolean) {
    if (controlledOnOpenChange) {
      controlledOnOpenChange(open);
    } else {
      setInternalOpen(open);
    }
    if (!open) resetState();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent
        className="max-h-[min(90vh,800px)] overflow-y-auto md:max-w-[85vw] xl:max-w-5xl"
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {activePlan ? "Change Your Plan" : "Pick Your Plan"}
          </DialogTitle>
          <DialogDescription>
            Pick a plan below and continue directly to secure checkout.
          </DialogDescription>
        </DialogHeader>

        {subscription?.status === "on_hold" ||
        subscription?.status === "failed" ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <TriangleAlertIcon className="text-destructive size-10" />
            <p className="font-semibold">Subscription payment issue</p>
            <p className="text-muted-foreground max-w-sm text-sm">
              Resolve your payment issue first, then return to change your plan.
            </p>
          </div>
        ) : (
          <section className="rounded-2xl p-6">
            {subscription?.isRenewing === false &&
            subscription?.status === "active" ? (
              <Alert className="mb-4">
                <InfoIcon className="size-4" />
                <AlertDescription>
                  Your renewal is turned off. Updating your plan will re-enable
                  renewal.
                </AlertDescription>
              </Alert>
            ) : null}

            <SubscriptionPlanSelect
              activePlan={activePlan}
              subscription={subscription}
              timeline={timeline}
              selectedPlan={selectedPlan}
              onSelectPlan={setSelectedPlan}
              onTimelineChange={setTimeline}
              onPlanAction={(plan) => {
                void handleSubscription(plan);
              }}
              isProcessing={isProcessing}
              processingPlan={processingPlan}
              pendingPlan={subscription?.pendingPlan}
              pendingTimeline={pendingTimeline}
            />
          </section>
        )}
      </DialogContent>
    </Dialog>
  );
}
