"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import axios from "axios";
import { toast } from "sonner";

import { localAPI } from "@/lib/api";
import { SubscriptionPlan } from "@/types/subscription";

export type DowngradeLimitError = {
  usage: { researches: number; drafts: number; proofs: number };
  limits: { researches: number; drafts: number; proofs: number };
};

export function useSubscription({
  activePlan,
  onSuccess,
}: {
  activePlan?: SubscriptionPlan | null;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [timeline, setTimeline] = useState<"monthly" | "annually">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null,
  );
  const [processingPlan, setProcessingPlan] = useState<SubscriptionPlan | null>(
    null,
  );
  const [downgradeLimitError, setDowngradeLimitError] =
    useState<DowngradeLimitError | null>(null);

  function resetState() {
    setSelectedPlan(null);
    setProcessingPlan(null);
    setTimeline("monthly");
    setDowngradeLimitError(null);
  }

  async function handleSubscription(plan: SubscriptionPlan) {
    const hasActiveSubscription = activePlan && activePlan !== "free";

    try {
      setSelectedPlan(plan);
      setProcessingPlan(plan);
      setDowngradeLimitError(null);

      const response = await (
        hasActiveSubscription ? localAPI.put : localAPI.post
      )("/dodopayments/subscription", {
        plan,
        timeline,
      });

      const data = response.data;
      const paymentLink = data?.paymentLink;

      if (!data?.success) {
        throw new Error(
          data?.error ??
            data?.message ??
            "Subscription failed. Please try again.",
        );
      }

      if (paymentLink) {
        toast.loading("Redirecting to payment page...");
        window.location.href = paymentLink;
        return;
      }

      if (data?.deferred) {
        const dateStr = data?.effectiveDate
          ? format(new Date(data.effectiveDate), "MMM d, yyyy")
          : "your next billing date";
        toast.success(`Your plan change is scheduled for ${dateStr}`);
      } else {
        toast.success(
          hasActiveSubscription
            ? "Subscription updated successfully"
            : "Subscription successful",
        );
      }

      resetState();
      onSuccess?.();
      router.refresh();
    } catch (error: unknown) {
      if (
        axios.isAxiosError(error) &&
        error.response?.data?.code === "DOWNGRADE_USAGE_LIMIT_EXCEEDED"
      ) {
        const {
          error: message,
          usage,
          limits,
        } = error.response.data as {
          error: string;
          usage: { researches: number; drafts: number; proofs: number };
          limits: { researches: number; drafts: number; proofs: number };
        };

        toast.error(
          message ?? "Cannot downgrade: usage exceeds the target plan limits.",
        );
        setDowngradeLimitError({ usage, limits });
        return;
      }

      toast.error("Subscription failed. Please try again.");
    } finally {
      setProcessingPlan(null);
    }
  }

  return {
    timeline,
    setTimeline,
    selectedPlan,
    setSelectedPlan,
    processingPlan,
    downgradeLimitError,
    handleSubscription,
    resetState,
    isProcessing: Boolean(processingPlan),
  };
}
