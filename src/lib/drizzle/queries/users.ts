"server-only";

import { eq } from "drizzle-orm/sql";
import { unstable_noStore as noStore } from "next/cache";

import { db } from "@/lib/drizzle";
import { InsertUser, SelectUser, user as users } from "@/lib/drizzle/schema";
import { DatabaseTransaction } from "@/types";

export async function getUser({
  email,
  id,
}: {
  email?: SelectUser["email"];
  id?: SelectUser["id"];
}) {
  noStore();

  const user = await db.query.user.findFirst({
    where: id ? eq(users.id, id) : eq(users.email, email?.toLowerCase() ?? ""),
  });

  return user ?? null;
}

export async function updateUser({
  tx,
  data: { id, email, ...data },
}: {
  tx?: DatabaseTransaction;
  data: Partial<InsertUser> & { id?: string };
}) {
  const editedUser = (
    await (tx ?? db)
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(id ? eq(users.id, id) : eq(users.email, email ?? ""))
      .returning()
  )?.[0];

  return editedUser;
}
