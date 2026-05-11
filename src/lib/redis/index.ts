import Redis from "ioredis";

/**
 * Lazy-loaded Redis client.
 * - Initializes on first access, not at module import (safe for Next.js build)
 * - Uses REDIS_URL only
 */
let redisInstance: Redis | null = null;

function initializeRedis(): Redis {
  if (redisInstance) {
    return redisInstance;
  }

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error("Missing Redis configuration. Set REDIS_URL.");
  }

  redisInstance = new Redis(redisUrl, {
    connectTimeout: 20000,
    keepAlive: 30000,
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(200 + times * 100, 5000);
      return delay;
    },
    /*reconnectOnError(err) {
      return err.message.includes("READONLY");
    },*/
    enableReadyCheck: true,
  });

  redisInstance.on("connect", () => {
    console.info("[Redis] Connected", {
      env: process.env.NODE_ENV,
    });
  });

  redisInstance.on("ready", () => {
    console.info("[Redis] Ready to accept commands");
  });

  redisInstance.on(
    "reconnecting",
    (info: { attempt?: number; delay: number }) => {
      console.warn("[Redis] Reconnecting", {
        attempt: info.attempt,
        delayMs: info.delay,
      });
    },
  );

  redisInstance.on("error", (err: Error) => {
    console.error("[Redis] Error", {
      code: (err as NodeJS.ErrnoException).code,
      message: err.message,
    });
  });

  redisInstance.on("close", () => {
    console.warn("[Redis] Connection closed");
  });

  redisInstance.on("end", () => {
    console.error("[Redis] Connection ended (no more reconnection attempts)");
  });

  return redisInstance;
}

/**
 * Lazy-loaded Redis proxy.
 * Initializes on first access, not at module load.
 * Allows Next.js build to succeed without Redis env vars.
 * At runtime, validates REDIS_URL on first use.
 */
export const redis: Redis = new Proxy({} as Redis, {
  get: (_target, prop) => {
    const instance = initializeRedis();
    return Reflect.get(instance, prop);
  },
}) as unknown as Redis;
