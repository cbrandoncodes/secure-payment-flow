import { NextRequest, NextResponse } from "next/server";
import { format } from "date-fns";

import { dodopayments } from "@/lib/dodopayments";
import { requireSessionAPI } from "@/lib/auth/server";
import { getUser } from "@/lib/drizzle/queries/users";
import {
  getSubscription,
  upsertSubscription,
} from "@/lib/drizzle/queries/subscriptions";
import { timelineProductToPlanMap } from "@/lib/utils/subscription";
import { classifyPlanChange } from "@/lib/subscription/classify-plan-change";
import {
  buildClearPendingFields,
  buildScheduleChangeFields,
} from "@/lib/utils/subscription/subscription-transitions";
import { getRateLimitHeaders, rateLimit } from "@/lib/rate-limit";
import { SubscriptionPlan } from "@/types/subscription";
import { PRICING_PLANS } from "@/lib/pricing";
import { validateDowngradeUsage } from "@/lib/subscription/validate-downgrade-usage";

const MAX_SUBSCRIPTIONS_PER_HOUR = 20;

export async function POST(request: NextRequest) {
  try {
    const session = await requireSessionAPI();
    if (session instanceof NextResponse) return session;

    const userId = session.user.id;

    const rateLimitResult = await rateLimit({
      key: "api:subscription:post",
      identifier: userId,
      limit: MAX_SUBSCRIPTIONS_PER_HOUR,
      windowSec: 3600,
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Too many requests. Please try again shortly.",
        },
        {
          status: 429,
          headers: {
            ...getRateLimitHeaders(rateLimitResult),
            "Retry-After": String(rateLimitResult.resetInSec),
          },
        },
      );
    }

    const activeUser = await getUser({ id: userId });

    if (!activeUser) {
      return NextResponse.json(
        { error: "User not found", reason: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const plan = body?.plan as SubscriptionPlan;
    const timeline = body?.timeline as "monthly" | "annually";
    const email = body?.email as string;

    const pricingPlan = PRICING_PLANS.find(({ id }) => id === plan);

    if (!plan || !pricingPlan || !timeline) {
      return NextResponse.json(
        { error: "Invalid subscription payload" },
        { status: 400 },
      );
    }

    const productId = Object.entries(timelineProductToPlanMap[timeline]).find(
      ([, value]) => value === plan,
    )?.[0] as string;

    console.info("Subscription payload", {
      plan,
      productId,
      email,
    });

    if (!productId) {
      return NextResponse.json(
        { error: "Invalid subscription plan" },
        { status: 400 },
      );
    }

    const localSubscription = await getSubscription({
      userId: activeUser.id,
    });

    let dodoCustomerId = localSubscription?.dodoCustomerId;

    if (!dodoCustomerId) {
      const customer = await dodopayments.customers.create({
        email: activeUser.email,
        name: activeUser?.name ?? undefined,
      });
      dodoCustomerId = customer.customer_id;
    }

    const existingDodoSubscriptionId = localSubscription?.dodoSubscriptionId;

    if (existingDodoSubscriptionId) {
      return NextResponse.json(
        { error: "Active subscription already exists" },
        { status: 400 },
      );
    }

    const checkoutSession = await dodopayments.checkoutSessions.create({
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      customer: {
        customer_id: dodoCustomerId ?? "",
        email: activeUser.email,
        name: activeUser?.name ?? undefined,
      },
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/app/settings?tab=billing`,
      metadata: {
        userId: activeUser.id,
      },
    });

    const paymentLink = checkoutSession?.checkout_url;

    console.info("Dodopayments subscription", { checkoutSession });

    return NextResponse.json({ paymentLink, success: true }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: message ?? "An unknown error occurred" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireSessionAPI();

    if (session instanceof NextResponse) return session;

    const userId = session.user.id;

    const rateLimitResult = await rateLimit({
      key: "api:subscription:put",
      identifier: userId,
      limit: MAX_SUBSCRIPTIONS_PER_HOUR,
      windowSec: 3600,
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Too many requests. Please try again shortly.",
        },
        {
          status: 429,
          headers: {
            ...getRateLimitHeaders(rateLimitResult),
            "Retry-After": String(rateLimitResult.resetInSec),
          },
        },
      );
    }

    const activeUser = await getUser({ id: userId });

    if (!activeUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const plan = body?.plan as SubscriptionPlan;
    const timeline = body?.timeline as "monthly" | "annually";

    const pricingPlan = PRICING_PLANS.find(({ id }) => id === plan);

    if (!plan || !pricingPlan || !timeline) {
      return NextResponse.json(
        { error: "Invalid subscription payload." },
        { status: 400 },
      );
    }

    const productId = Object.entries(timelineProductToPlanMap[timeline]).find(
      ([, value]) => value === plan,
    )?.[0] as string;

    if (!productId) {
      return NextResponse.json(
        { error: "Invalid subscription plan" },
        { status: 400 },
      );
    }

    const localSubscription = await getSubscription({
      userId: activeUser.id,
    });
    if (!localSubscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 },
      );
    }

    if (
      localSubscription.status === "on_hold" ||
      localSubscription.status === "failed"
    ) {
      return NextResponse.json(
        {
          error:
            "Your subscription has a payment issue. Please update your payment method before changing your plan.",
        },
        { status: 400 },
      );
    }

    // change classification and add guard checks
    const currentPlan = localSubscription.plan;
    const changeType = classifyPlanChange({
      currentPlan,
      newPlan: plan,
      currentProductId: localSubscription?.dodoPlanId,
      newProductId: productId,
    });

    if (changeType === "same") {
      return NextResponse.json(
        { error: "Subscription plan is the same as the current plan" },
        { status: 400 },
      );
    }

    if (changeType === "downgrade") {
      const usageCheck = await validateDowngradeUsage({
        userId: activeUser.id,
        targetPlan: plan,
        targetTimeline: timeline,
        changeType,
      });
      if (!usageCheck.ok) {
        return NextResponse.json(
          {
            error: usageCheck.message,
            code: usageCheck.code,
          },
          { status: 400 },
        );
      }
    }

    const hasPending = !!localSubscription.pendingPlanId;

    if (
      hasPending &&
      (changeType === "downgrade" || changeType === "cycle-change")
    ) {
      const effectiveDate = localSubscription.pendingPlanEffectiveDate
        ? format(localSubscription.pendingPlanEffectiveDate, "MMM d, yyyy")
        : "the next billing date";
      return NextResponse.json(
        {
          error: `You already have a plan change scheduled for ${effectiveDate}. Cancel it first or wait for it to take effect.`,
        },
        { status: 400 },
      );
    }

    const existingDodoSubscriptionId = localSubscription?.dodoSubscriptionId;

    if (!existingDodoSubscriptionId) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 },
      );
    }

    const isDeferred =
      changeType === "downgrade" || changeType === "cycle-change";

    if (isDeferred) {
      // schedule plan change for the next billing date (no charge now)
      await dodopayments.subscriptions.changePlan(existingDodoSubscriptionId, {
        product_id: productId,
        quantity: 1,
        proration_billing_mode: "full_immediately",
        effective_at: "next_billing_date",
      });

      await upsertSubscription({
        data: buildScheduleChangeFields({
          id: localSubscription.id,
          plan: localSubscription.plan,
          pendingPlanId: productId,
          pendingPlan: plan,
          pendingPlanEffectiveDate: localSubscription.periodEnd ?? null,
          pendingTimeline: timeline,
        }),
      });

      // send deferred change email

      return NextResponse.json(
        {
          success: true,
          deferred: true,
          effectiveDate: localSubscription.periodEnd?.toISOString() ?? null,
        },
        { status: 200 },
      );
    }

    // Immediate change: apply now
    await dodopayments.subscriptions.changePlan(existingDodoSubscriptionId, {
      product_id: productId,
      quantity: 1,
      proration_billing_mode: "difference_immediately",
    });

    // Clear any existing pending change
    if (localSubscription.pendingPlanId) {
      await upsertSubscription({
        data: buildClearPendingFields({
          id: localSubscription.id,
          plan: localSubscription.plan,
        }),
      });
    }

    await upsertSubscription({
      data: {
        id: localSubscription.id,
        plan,
      } as Parameters<typeof upsertSubscription>[0]["data"],
    });

    return NextResponse.json(
      { success: true, deferred: false },
      { status: 200 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: message ?? "An unknown error occurred" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const session = await requireSessionAPI();
    if (session instanceof NextResponse) return session;

    const userId = session.user.id;

    const activeUser = await getUser({ id: userId });

    if (!activeUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const localSubscription = await getSubscription({
      userId,
    });
    const dodoSubscriptionId = localSubscription?.dodoSubscriptionId;

    const dodoSubscription = dodoSubscriptionId
      ? await dodopayments.subscriptions.retrieve(dodoSubscriptionId)
      : null;

    if (!dodoSubscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 },
      );
    }

    await dodopayments.subscriptions.update(dodoSubscription.subscription_id, {
      cancel_at_next_billing_date: true,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: message ?? "An unknown error occurred" },
      { status: 500 },
    );
  }
}
