"server-only";

import { eq } from "drizzle-orm/sql";

import { db } from "@/lib/drizzle";
import { InsertSubscription, subscriptions } from "@/lib/drizzle/schema";
import { DatabaseTransaction } from "@/types";

export async function getSubscriptionById({ id }: { id: string }) {
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.id, id),
  });
  return subscription;
}

export async function getSubscription({ userId }: { userId?: string }) {
  if (!userId) {
    throw new Error("userId is required");
  }

  const whereClause = userId ? eq(subscriptions.userId, userId) : undefined;

  const subscription = whereClause
    ? await db.query.subscriptions.findFirst({
        where: whereClause,
      })
    : null;

  return subscription ?? null;
}

export async function getSubscriptionByThirdPartyId({
  subscriptionId,
}: {
  subscriptionId: string;
}) {
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.dodoSubscriptionId, subscriptionId),
  });
  return subscription;
}

export async function upsertSubscription({
  data,
  tx,
}: {
  data: InsertSubscription;
  tx?: DatabaseTransaction;
}) {
  let existingSubscription = data.id
    ? await getSubscriptionById({ id: data.id })
    : null;

  if (!existingSubscription) {
    existingSubscription = await getSubscription({
      userId: data?.userId ?? undefined,
    });
  }

  const upsertedSubscription = existingSubscription
    ? (
        await (tx ? tx : db)
          .update(subscriptions)
          .set({ ...data, modifiedAt: new Date() })
          .where(eq(subscriptions.id, existingSubscription.id))
          .returning()
      )?.[0]
    : (
        await (tx ? tx : db).insert(subscriptions).values(data).returning()
      )?.[0];

  return upsertedSubscription;
}
