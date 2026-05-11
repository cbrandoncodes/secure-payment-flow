"server-only";

import { InsertSubscription } from "@/lib/drizzle/schema";
import { SubscriptionPlan, SubscriptionTimeline } from "@/types/subscription";

const CLEAR_PENDING = {
  pendingPlanId: null,
  pendingPlan: null,
  pendingPlanEffectiveDate: null,
  pendingTimeline: null,
} as const satisfies Partial<InsertSubscription>;

export function buildActivateFields(p: {
  id?: string;
  plan: SubscriptionPlan;
  timeline: SubscriptionTimeline | undefined;
  dodoSubscriptionId: string;
  dodoCustomerId?: string | null;
  dodoPlanId: string;
  periodStart: Date;
  periodEnd: Date;
  status: InsertSubscription["status"];
  trialPeriodEnd?: Date | null;
  userId?: string | null;
  tenantId?: string | null;
}): InsertSubscription {
  return {
    id: p.id,
    userId: p.userId,
    plan: p.plan,
    timeline: p.timeline ?? null,
    dodoSubscriptionId: p.dodoSubscriptionId,
    dodoCustomerId: p.dodoCustomerId ?? null,
    dodoPlanId: p.dodoPlanId,
    periodStart: p.periodStart,
    periodEnd: p.periodEnd,
    status: p.status,
    trialPeriodEnd: p.trialPeriodEnd ?? null,
    isRenewing: true,
    paymentFailureCount: 0,
    paymentFailureFirstAt: null,
    ...CLEAR_PENDING,
  };
}

export function buildPlanChangedFields(p: {
  id: string;
  plan: SubscriptionPlan;
  timeline: SubscriptionTimeline | undefined;
  dodoSubscriptionId: string;
  dodoCustomerId?: string | null;
  dodoPlanId: string;
  periodStart: Date;
  periodEnd: Date;
  status: InsertSubscription["status"];
}): InsertSubscription {
  return {
    id: p.id,
    plan: p.plan,
    timeline: p.timeline ?? null,
    dodoSubscriptionId: p.dodoSubscriptionId,
    dodoCustomerId: p.dodoCustomerId ?? null,
    dodoPlanId: p.dodoPlanId,
    periodStart: p.periodStart,
    periodEnd: p.periodEnd,
    status: p.status,
    ...CLEAR_PENDING,
  };
}

export function buildRenewedFields(p: {
  id: string;
  plan: SubscriptionPlan;
  timeline: SubscriptionTimeline | undefined;
  dodoSubscriptionId: string;
  dodoPlanId: string;
  periodStart: Date;
  periodEnd: Date;
  status: InsertSubscription["status"];
}): InsertSubscription {
  return {
    id: p.id,
    plan: p.plan,
    timeline: p.timeline ?? null,
    dodoSubscriptionId: p.dodoSubscriptionId,
    dodoPlanId: p.dodoPlanId,
    periodStart: p.periodStart,
    periodEnd: p.periodEnd,
    status: p.status,
    isRenewing: true,
    paymentFailureCount: 0,
    paymentFailureFirstAt: null,
    ...CLEAR_PENDING,
  };
}

export function buildCancelledFields(id: string): InsertSubscription {
  return {
    id,
    plan: "free",
    timeline: null,
    dodoSubscriptionId: null,
    dodoCustomerId: null,
    dodoPlanId: null,
    periodStart: null,
    periodEnd: null,
    status: "cancelled",
    ...CLEAR_PENDING,
  };
}

export function buildOnHoldFields(id: string): InsertSubscription {
  return {
    id,
    plan: "free",
    timeline: null,
    dodoSubscriptionId: null,
    dodoPlanId: null,
    periodStart: null,
    periodEnd: null,
    status: "on_hold",
    ...CLEAR_PENDING,
  };
}

export function buildPaymentFailedFields(p: {
  id: string;
  plan: SubscriptionPlan;
  currentFailureCount: number;
  firstFailureAt: Date | null;
}): InsertSubscription {
  return {
    id: p.id,
    plan: p.plan,
    status: "failed",
    paymentFailureCount: p.currentFailureCount + 1,
    paymentFailureFirstAt: p.firstFailureAt ?? new Date(),
    ...CLEAR_PENDING,
  };
}

export function buildGracePeriodFields(
  id: string,
  plan: SubscriptionPlan,
): InsertSubscription {
  return {
    id,
    plan,
    status: "on_hold",
    ...CLEAR_PENDING,
  };
}

export function buildExpiredFields(id: string): InsertSubscription {
  return {
    id,
    plan: "free",
    timeline: null,
    dodoSubscriptionId: null,
    dodoPlanId: null,
    periodStart: null,
    periodEnd: null,
    status: "on_hold",
    paymentFailureCount: 0,
    paymentFailureFirstAt: null,
    ...CLEAR_PENDING,
  };
}

export function buildDunningRevokedFields(id: string): InsertSubscription {
  return {
    id,
    plan: "free",
    timeline: null,
    dodoSubscriptionId: null,
    dodoPlanId: null,
    periodStart: null,
    periodEnd: null,
    status: "on_hold",
    paymentFailureCount: 0,
    paymentFailureFirstAt: null,
    ...CLEAR_PENDING,
  };
}

export function buildScheduleChangeFields(p: {
  id: string;
  plan: SubscriptionPlan; // current (unchanged) plan
  pendingPlanId: string;
  pendingPlan: SubscriptionPlan;
  pendingPlanEffectiveDate: Date | null;
  pendingTimeline: SubscriptionTimeline;
}): InsertSubscription {
  return {
    id: p.id,
    plan: p.plan,
    pendingPlanId: p.pendingPlanId,
    pendingPlan: p.pendingPlan,
    pendingPlanEffectiveDate: p.pendingPlanEffectiveDate,
    pendingTimeline: p.pendingTimeline,
  };
}

export function buildClearPendingFields(current: {
  id: string;
  plan: SubscriptionPlan;
}): InsertSubscription {
  return {
    id: current.id,
    plan: current.plan,
    ...CLEAR_PENDING,
  };
}
