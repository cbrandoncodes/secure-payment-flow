import { getServerSession } from "@/lib/auth/server";
import { getSubscription } from "@/lib/drizzle/queries/subscriptions";
import { ActivePlanBanner } from "./components/active-plan-banner";

export async function LandingPage() {
  const session = await getServerSession();
  const subscription = session?.user
    ? await getSubscription({ userId: session.user.id })
    : null;

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-5xl px-4 py-20 text-center">
        <h1 className="mt-4 text-5xl font-extrabold tracking-tight">
          Payments done&nbsp;<span className="text-primary">securely</span>.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          A practical example of secure recurring payment integration for SaaS
          applications using Next.js, Dodo Payments, and Better Auth.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16">
        <ActivePlanBanner subscription={subscription} />
      </section>
    </main>
  );
}
