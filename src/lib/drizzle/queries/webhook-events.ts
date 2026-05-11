"server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/lib/drizzle";
import { webhookEvents } from "@/lib/drizzle/schema";

export async function hasProcessedWebhookEvent({
  eventId,
  eventType,
}: {
  eventId: string;
  eventType: string;
}): Promise<boolean> {
  const existing = await db.query.webhookEvents.findFirst({
    where: and(
      eq(webhookEvents.eventId, eventId),
      eq(webhookEvents.eventType, eventType),
    ),
    columns: { id: true },
  });
  return !!existing;
}

export async function insertProcessedWebhookEvent({
  eventId,
  eventType,
}: {
  eventId: string;
  eventType: string;
}) {
  await db
    .insert(webhookEvents)
    .values({ eventId, eventType })
    .onConflictDoNothing();
}
