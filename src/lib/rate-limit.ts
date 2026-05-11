import { NextRequest } from "next/server";

import { redis } from "@/lib/redis";

type RateLimitOptions = {
  key: string;
  identifier: string;
  limit: number;
  windowSec: number;
};

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  resetInSec: number;
};

function safePositiveInt(value: number, fallback: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return fallback;
  }
  return Math.floor(value);
}

export function getRequestIdentifier(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    forwarded?.split(",")?.[0]?.trim() ??
    "unknown";
  const userAgent = request.headers.get("user-agent") ?? "unknown";

  return `${ip}:${userAgent}`;
}

export function getRateLimitHeaders(result: RateLimitResult) {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.resetInSec),
  };
}

export async function rateLimit({
  key,
  identifier,
  limit,
  windowSec,
}: RateLimitOptions): Promise<RateLimitResult> {
  if (process.env.NODE_ENV !== "production") {
    return {
      success: true,
      limit,
      remaining: limit,
      resetInSec: windowSec,
    };
  }

  const safeLimit = safePositiveInt(limit, 60);
  const safeWindow = safePositiveInt(windowSec, 60);
  const redisKey = `rate_limit:${key}:${identifier}`;

  try {
    const count = await redis.incr(redisKey);

    if (count === 1) {
      await redis.expire(redisKey, safeWindow);
    }

    let ttl = await redis.ttl(redisKey);
    if (ttl < 0) {
      await redis.expire(redisKey, safeWindow);
      ttl = safeWindow;
    }

    const remaining = Math.max(0, safeLimit - count);

    return {
      success: count <= safeLimit,
      limit: safeLimit,
      remaining,
      resetInSec: ttl,
    };
  } catch (error: unknown) {
    console.error("[RateLimit] Redis error - allowing request", {
      key,
      identifier,
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return {
      success: true,
      limit: safeLimit,
      remaining: safeLimit,
      resetInSec: safeWindow,
    };
  }
}
