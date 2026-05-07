"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

export function Signout() {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/auth");
    router.refresh();
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSignOut}
      className="w-full"
    >
      Sign out
    </Button>
  );
}
