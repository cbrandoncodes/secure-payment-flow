"use client";

import { AlertTriangleIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Props = {
  usage: { researches: number; drafts: number; proofs: number };
  limits: { researches: number; drafts: number; proofs: number };
};

export default function DowngradeUsageWarning({ usage, limits }: Props) {
  return (
    <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
      <AlertTriangleIcon className="size-4" />
      <AlertTitle>Downgrade requires cleanup</AlertTitle>
      <AlertDescription>
        Your current usage exceeds the limits of the selected plan.
        {usage.researches > limits.researches && (
          <span className="block">
            Researches: {usage.researches} used / {limits.researches} allowed
          </span>
        )}
        {usage.drafts > limits.drafts && (
          <span className="block">
            Drafts: {usage.drafts} used / {limits.drafts} allowed
          </span>
        )}
        {usage.proofs > limits.proofs && (
          <span className="block">
            Proofs: {usage.proofs} used / {limits.proofs} allowed
          </span>
        )}
      </AlertDescription>
    </Alert>
  );
}
