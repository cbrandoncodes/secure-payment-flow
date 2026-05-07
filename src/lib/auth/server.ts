import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from ".";

export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session ?? null;
}

export async function requireSession() {
  const session = await getServerSession();
  if (!session) redirect("/auth");
  return session;
}
