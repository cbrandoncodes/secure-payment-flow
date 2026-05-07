import { type NextRequest, NextResponse } from "next/server";
import { betterFetch } from "@better-fetch/fetch";

import type { auth } from "@/lib/auth";

type Session = typeof auth.$Infer.Session;

export async function proxy(request: NextRequest) {
  const { data: session } = await betterFetch<Session>(
    `/api/auth/get-session`,
    {
      baseURL: request.nextUrl.origin,
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    },
  );

  const pathname = request.nextUrl.pathname;

  if (!session && pathname.startsWith("/account")) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  if (session?.user && pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/account", request.url));
  }

  return NextResponse.next();
}
export const config = {
  /*
   * Match all paths except for:
   * 1. /api routes
   * 2. /_next (Next.js internals)
   * 3. all root files inside /public (e.g. /favicon.ico)
   */
  matcher: ["/app/:path*", "/((?!api|_next|[\\w-]+\\.\\w+).*)"],
};
