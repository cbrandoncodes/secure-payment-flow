import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from ".";
import { NextResponse } from "next/server";

export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function requireSession() {
  const session = await getServerSession();
  if (!session) redirect("/auth");
  return session;
}

export async function requireSessionAPI() {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return session as NonNullable<Awaited<ReturnType<typeof getServerSession>>>;
}
