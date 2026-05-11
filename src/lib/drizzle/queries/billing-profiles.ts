"server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/lib//drizzle";
import { InsertBillingProfile, billingProfiles } from "@/lib/drizzle/schema";

export async function getBillingProfile({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  const profile = await db.query.billingProfiles.findFirst({
    where: and(eq(billingProfiles.id, id), eq(billingProfiles.userId, userId)),
  });
  return profile;
}

export async function getBillingProfileByUserId({
  userId,
}: {
  userId: string;
}) {
  const billingProfile = await db.query.billingProfiles.findFirst({
    where: eq(billingProfiles.userId, userId),
  });
  return billingProfile;
}

export async function upsertBillingProfile({
  data: { userId, ...data },
}: {
  data: InsertBillingProfile & { userId: string };
}) {
  const upsertedProfile = await db.transaction(async (tx) => {
    const existingProfile = await tx.query.billingProfiles.findFirst({
      where: eq(billingProfiles.userId, userId),
    });

    return (
      await (existingProfile
        ? tx
            .update(billingProfiles)
            .set({
              ...data,
              modifiedAt: new Date(),
            })
            .where(eq(billingProfiles.userId, userId))
            .returning()
        : tx
            .insert(billingProfiles)
            .values({ ...data, userId })
            .returning())
    )?.[0];
  });
  return upsertedProfile;
}
