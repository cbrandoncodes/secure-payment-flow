import { Webhooks } from "@dodopayments/nextjs";
import { addDays } from "date-fns";
import { NextRequest } from "next/server";
import {
  getSubscriptionByThirdPartyId,
  upsertSubscription,
} from "@/lib/drizzle/queries/subscriptions";
import { dodopayments } from "@/lib/dodopayments";
import {
  getTimelineFromProductId,
  baseProductToPlanMap,
} from "@/lib/utils/subscription";
import { db } from "@/lib/drizzle";
import { getUser } from "@/lib/drizzle/queries/users";
import {
  hasProcessedWebhookEvent,
  insertProcessedWebhookEvent,
} from "@/lib/drizzle/queries/webhook-events";
import {
  buildActivateFields,
  buildCancelledFields,
  buildOnHoldFields,
  buildPaymentFailedFields,
  buildPlanChangedFields,
  buildRenewedFields,
} from "@/lib/utils/subscription/subscription-transitions";

const webhookHandler = Webhooks({
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY!,
  onSubscriptionUpdated: async (payload) => {
    const dodoSubscriptionId = payload.data?.subscription_id;

    console.info("subscription.updated", {
      dodoSubscriptionId,
      payload,
    });

    if (!dodoSubscriptionId) {
      console.error("No dodo subscription id on subscription.updated webhook", {
        payload,
      });
      return;
    }

    const eventKey = `${dodoSubscriptionId}:${payload.type}:${payload.data?.subscription_period_count ?? 0}`;
    if (
      await hasProcessedWebhookEvent({
        eventId: eventKey,
        eventType: payload.type,
      })
    ) {
      console.info("Duplicate webhook event skipped", { eventKey });
      return;
    }

    const existingSubscription = await getSubscriptionByThirdPartyId({
      subscriptionId: dodoSubscriptionId,
    });

    if (!existingSubscription) {
      console.warn("Subscription not found for update webhook", {
        dodoSubscriptionId,
      });
      return;
    }

    const dodoSubscription =
      await dodopayments.subscriptions.retrieve(dodoSubscriptionId);

    const productId = dodoSubscription?.product_id;
    const plan = productId ? baseProductToPlanMap[productId] : null;

    if (!plan) {
      console.error("Plan not found for product ID", {
        productId,
        dodoSubscriptionId,
      });
      return;
    }

    const cancelAtNextBillingDate =
      dodoSubscription?.cancel_at_next_billing_date;
    const isRenewing = !cancelAtNextBillingDate;

    await db.transaction(async (tx) => {
      await upsertSubscription({
        tx,
        data: {
          id: existingSubscription.id,
          dodoSubscriptionId,
          plan,
          timeline: getTimelineFromProductId(productId),
          isRenewing,
        },
      });
    });

    await insertProcessedWebhookEvent({
      eventId: eventKey,
      eventType: payload.type,
    });
  },
  onSubscriptionActive: async (payload) => {
    const dodoSubscriptionId = payload.data?.subscription_id;

    console.info("subscription.active", {
      dodoSubscriptionId,
      payload,
    });

    const eventKey = `${dodoSubscriptionId}:${payload.type}:${payload.data?.subscription_period_count ?? 0}`;
    if (
      await hasProcessedWebhookEvent({
        eventId: eventKey,
        eventType: payload.type,
      })
    ) {
      console.info("Duplicate webhook event skipped", { eventKey });
      return;
    }

    let subscription = await getSubscriptionByThirdPartyId({
      subscriptionId: dodoSubscriptionId,
    });

    const dodoSubscription = dodoSubscriptionId
      ? await dodopayments.subscriptions.retrieve(dodoSubscriptionId)
      : null;
    const productId = dodoSubscription?.product_id;
    const plan = productId ? baseProductToPlanMap[productId] : null;

    if (!plan) {
      console.error("Plan not found for product ID", {
        productId,
      });
      return;
    }

    if (!dodoSubscription) {
      console.error("Dodo Payments subscription not found for active webhook", {
        dodoSubscriptionId,
      });
      return;
    }

    const periodStart = new Date(dodoSubscription.created_at);
    const periodEnd = new Date(
      dodoSubscription?.expires_at ?? addDays(periodStart, 30),
    );

    const subscriptionUser = await getUser({
      id: dodoSubscription?.metadata?.userId,
    });

    console.info("[subscription.active entities]", {
      subscriptionUser,
    });

    const trialPeriodEnd = dodoSubscription?.trial_period_days
      ? addDays(periodStart, dodoSubscription?.trial_period_days ?? 0)
      : null;
    const timeline = getTimelineFromProductId(productId);
    await db.transaction(async (tx) => {
      subscription = await upsertSubscription({
        tx,
        data: buildActivateFields({
          ...(subscription?.id ? { id: subscription.id } : {}),
          userId: subscriptionUser?.id,
          plan,
          timeline,
          dodoSubscriptionId: dodoSubscriptionId,
          dodoCustomerId: dodoSubscription.customer?.customer_id,
          dodoPlanId: dodoSubscription.product_id,
          periodStart,
          periodEnd,
          status: dodoSubscription.status,
          trialPeriodEnd,
        }),
      });
      if (timeline && subscriptionUser?.id) {
        // set usage
      }
    });

    if (!subscription) {
      console.error("[subscription.active - Subscription not found]", {
        dodoSubscriptionId,
      });
      return;
    }

    console.info("[subscription.active - subscription]", {
      subscription,
    });

    console.info("Subscription activated successfully", {
      dodoSubscriptionId,
      status: dodoSubscription.status,
    });

    const localSubscriptionUser = subscription?.userId
      ? await getUser({
          id: subscription?.userId,
        })
      : null;
    if (localSubscriptionUser) {
      // send activation email
    }

    await insertProcessedWebhookEvent({
      eventId: eventKey,
      eventType: payload.type,
    });
  },
  onSubscriptionPlanChanged: async (payload) => {
    const customerEmail = payload.data?.customer?.email;
    const dodoSubscriptionId = payload.data?.subscription_id;

    console.info("subscription.plan_changed", {
      dodoSubscriptionId,
    });

    const eventKey = `${dodoSubscriptionId}:${payload.type}:${payload.data?.subscription_period_count ?? 0}`;
    if (
      await hasProcessedWebhookEvent({
        eventId: eventKey,
        eventType: payload.type,
      })
    ) {
      console.info("Duplicate webhook event skipped", { eventKey });
      return;
    }

    const subscription = await getSubscriptionByThirdPartyId({
      subscriptionId: dodoSubscriptionId,
    });

    if (!subscription) {
      console.error("Subscription not found for plan change webhook", {
        dodoSubscriptionId,
      });
      return;
    }

    const dodoSubscription = dodoSubscriptionId
      ? await dodopayments.subscriptions.retrieve(dodoSubscriptionId)
      : null;

    if (!dodoSubscription) {
      console.error(
        "Dodo Payments subscription not found for plan change webhook",
        {
          dodoSubscriptionId,
          customerEmail,
        },
      );
      return;
    }

    const periodStart = new Date(dodoSubscription.created_at);
    const periodEnd = new Date(
      dodoSubscription?.expires_at ?? addDays(periodStart, 30),
    );
    const productId = dodoSubscription?.product_id;
    const plan = productId ? baseProductToPlanMap[productId] : null;
    const hadDeferredPlanChange = Boolean(subscription.pendingPlanId);
    const newTimeline = getTimelineFromProductId(productId);

    if (!plan) {
      console.error("Plan not found for product id", {
        productId: dodoSubscription.product_id,
      });
      return;
    }

    await db.transaction(async (tx) => {
      const upsertedSubscription = await upsertSubscription({
        tx,
        data: buildPlanChangedFields({
          id: subscription.id,
          dodoSubscriptionId: dodoSubscriptionId,
          dodoCustomerId: dodoSubscription.customer?.customer_id,
          dodoPlanId: dodoSubscription.product_id,
          periodStart,
          periodEnd,
          status: dodoSubscription.status,
          plan,
          timeline: newTimeline,
        }),
      });

      if (!upsertedSubscription) {
        console.error("[subscription.planchanged - Subscription not found]", {
          dodoSubscriptionId,
        });
        return;
      }

      if (newTimeline && subscription.userId) {
        // set usage
      }
    });

    console.info("Subscription plan changed successfully", {
      customerEmail,
      dodoSubscriptionId,
      newPlan: plan,
      productId: dodoSubscription.product_id,
    });

    const localSubscriptionUser = subscription?.userId
      ? await getUser({
          id: subscription?.userId,
        })
      : null;

    if (localSubscriptionUser && hadDeferredPlanChange) {
      // deferred plan change email
    }

    if (localSubscriptionUser && !hadDeferredPlanChange) {
      // instant plan change email
    }

    await insertProcessedWebhookEvent({
      eventId: eventKey,
      eventType: payload.type,
    });
  },
  onSubscriptionCancelled: async (payload) => {
    const customerEmail = payload.data?.customer?.email;
    const dodoSubscriptionId = payload.data?.subscription_id;

    console.info("subscription.cancelled", {
      customerEmail,
      dodoSubscriptionId,
    });

    const eventKey = `${dodoSubscriptionId}:${payload.type}:${payload.data?.subscription_period_count ?? 0}`;
    if (
      await hasProcessedWebhookEvent({
        eventId: eventKey,
        eventType: payload.type,
      })
    ) {
      console.info("Duplicate webhook event skipped", { eventKey });
      return;
    }

    const subscription = await getSubscriptionByThirdPartyId({
      subscriptionId: dodoSubscriptionId,
    });

    if (!subscription) {
      console.error("Subscription not found for cancellation webhook", {
        dodoSubscriptionId,
      });
      return;
    }

    const dodoSubscription = dodoSubscriptionId
      ? await dodopayments.subscriptions.retrieve(dodoSubscriptionId)
      : null;

    if (!dodoSubscription) {
      console.error(
        "Dodo Payments subscription not found for cancellation webhook",
        {
          dodoSubscriptionId,
        },
      );
      return;
    }

    await db.transaction(async (tx) => {
      const cancelledFields = buildCancelledFields(subscription.id);
      await upsertSubscription({
        tx,
        data: cancelledFields,
      });

      if (subscription.userId) {
        // reset usage
      }
    });

    console.info("Subscription cancelled successfully", {
      customerEmail,
      previousSubscriptionId: dodoSubscriptionId,
    });

    const localSubscriptionUser = subscription?.userId
      ? await getUser({
          id: subscription?.userId,
        })
      : null;
    if (localSubscriptionUser) {
      // send cancellation email
    }

    await insertProcessedWebhookEvent({
      eventId: eventKey,
      eventType: payload.type,
    });
  },
  onSubscriptionOnHold: async (payload) => {
    const customerEmail = payload.data?.customer?.email;
    const dodoSubscriptionId = payload.data?.subscription_id;

    console.info("subscription.on_hold", {
      customerEmail,
      dodoSubscriptionId,
    });

    const eventKey = `${dodoSubscriptionId}:${payload.type}:${payload.data?.subscription_period_count ?? 0}`;
    if (
      await hasProcessedWebhookEvent({
        eventId: eventKey,
        eventType: payload.type,
      })
    ) {
      console.info("Duplicate webhook event skipped", { eventKey });
      return;
    }

    const subscription = await getSubscriptionByThirdPartyId({
      subscriptionId: dodoSubscriptionId,
    });

    if (!subscription) {
      console.error("Subscription not found for on_hold webhook", {
        dodoSubscriptionId,
      });
      return;
    }

    const dodoSubscription = dodoSubscriptionId
      ? await dodopayments.subscriptions.retrieve(dodoSubscriptionId)
      : null;

    if (!dodoSubscription) {
      console.error(
        "Dodo Payments subscription not found for on_hold webhook",
        {
          dodoSubscriptionId,
        },
      );
      return;
    }

    await db.transaction(async (tx) => {
      const onHoldFields = buildOnHoldFields(subscription.id);
      await upsertSubscription({
        tx,
        data: onHoldFields,
      });
      if (subscription.userId) {
        // reset usage
      }
    });

    console.info("Subscription placed on hold successfully", {
      customerEmail,
      dodoSubscriptionId,
    });

    const onHoldUser = subscription?.userId
      ? await getUser({ id: subscription.userId })
      : null;
    if (onHoldUser) {
      // send on hold email
    }

    await insertProcessedWebhookEvent({
      eventId: eventKey,
      eventType: payload.type,
    });
  },
  onSubscriptionFailed: async (payload) => {
    const customerEmail = payload.data?.customer?.email;
    const dodoSubscriptionId = payload.data?.subscription_id;

    console.info("subscription.failed", {
      customerEmail,
      dodoSubscriptionId,
    });

    const eventKey = `${dodoSubscriptionId}:${payload.type}:${payload.data?.subscription_period_count ?? 0}`;
    if (
      await hasProcessedWebhookEvent({
        eventId: eventKey,
        eventType: payload.type,
      })
    ) {
      console.info("Duplicate webhook event skipped", { eventKey });
      return;
    }

    const subscription = await getSubscriptionByThirdPartyId({
      subscriptionId: dodoSubscriptionId,
    });

    if (!subscription) {
      console.error("Subscription not found for failed webhook", {
        dodoSubscriptionId,
      });
      return;
    }

    const dodoSubscription = dodoSubscriptionId
      ? await dodopayments.subscriptions.retrieve(dodoSubscriptionId)
      : null;

    if (!dodoSubscription) {
      console.error("Dodo Payments subscription not found for failed webhook", {
        dodoSubscriptionId,
      });
      return;
    }

    const newFailureCount = (subscription.paymentFailureCount ?? 0) + 1;

    await upsertSubscription({
      data: buildPaymentFailedFields({
        id: subscription.id,
        plan: subscription.plan,
        currentFailureCount: subscription.paymentFailureCount ?? 0,
        firstFailureAt: subscription.paymentFailureFirstAt,
      }),
    });

    console.info("Subscription marked as failed — starting dunning", {
      customerEmail,
      dodoSubscriptionId,
      newFailureCount,
    });

    const failedUser = subscription?.userId
      ? await getUser({ id: subscription.userId })
      : null;
    if (failedUser) {
      // send payment failed email
    }

    await insertProcessedWebhookEvent({
      eventId: eventKey,
      eventType: payload.type,
    });
  },
  onSubscriptionRenewed: async (payload) => {
    const customerEmail = payload.data?.customer?.email;
    const dodoSubscriptionId = payload.data?.subscription_id;

    console.info("subscription.renewed", {
      customerEmail,
      dodoSubscriptionId,
    });

    const eventKey = `${dodoSubscriptionId}:${payload.type}:${payload.data?.subscription_period_count ?? 0}`;
    if (
      await hasProcessedWebhookEvent({
        eventId: eventKey,
        eventType: payload.type,
      })
    ) {
      console.info("Duplicate webhook event skipped", { eventKey });
      return;
    }

    const subscription = await getSubscriptionByThirdPartyId({
      subscriptionId: dodoSubscriptionId,
    });

    if (!subscription) {
      console.error("Subscription not found for renewal webhook", {
        dodoSubscriptionId,
      });
      return;
    }

    const dodoSubscription = dodoSubscriptionId
      ? await dodopayments.subscriptions.retrieve(dodoSubscriptionId)
      : null;

    if (!dodoSubscription) {
      console.error(
        "Dodo Payments subscription not found for renewal webhook",
        {
          dodoSubscriptionId,
        },
      );
      return;
    }

    const periodStart = new Date(dodoSubscription.created_at);
    const periodEnd = new Date(
      dodoSubscription?.expires_at ?? addDays(periodStart, 30),
    );
    const productId = dodoSubscription?.product_id;
    const plan = productId ? baseProductToPlanMap[productId] : null;

    if (!plan) {
      console.error("Plan not found for product id", {
        productId,
      });
      return;
    }

    const subscriptionUser = await getUser({
      id: dodoSubscription?.metadata?.userId,
    });
    const renewedTimeline = getTimelineFromProductId(productId);

    await db.transaction(async (tx) => {
      const upsertedSubscription = await upsertSubscription({
        tx,
        data: buildRenewedFields({
          id: subscription.id,
          dodoSubscriptionId: dodoSubscriptionId,
          dodoPlanId: dodoSubscription.product_id,
          periodStart,
          periodEnd,
          status: dodoSubscription.status,
          plan,
          timeline: renewedTimeline,
        }),
      });

      if (!upsertedSubscription) {
        console.error("[subscription.renewed - Subscription not found]", {
          dodoSubscriptionId,
        });
        return;
      }

      if (renewedTimeline && subscriptionUser?.id) {
        // set usage
      }
    });

    console.info("Subscription renewed successfully", {
      customerEmail,
      dodoSubscriptionId,
      plan,
      periodEnd: periodEnd.toISOString(),
    });

    const localSubscriptionUser = subscription?.userId
      ? await getUser({
          id: subscription?.userId,
        })
      : null;
    if (localSubscriptionUser) {
      // send renewed email
    }

    await insertProcessedWebhookEvent({
      eventId: eventKey,
      eventType: payload.type,
    });
  },
});

export async function POST(request: NextRequest) {
  return webhookHandler(request);
}
