import { config } from "dotenv";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";

import * as schema from "./schema";

config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 15_000,
  query_timeout: 15_000,
  statement_timeout: 15_000,
  keepAlive: true,
});

export const db = drizzle(pool, { schema });

// RLS
export async function withUserContext<T>(
  userId: string,
  queryFn: (db: NodePgDatabase<typeof schema>) => Promise<T>,
) {
  return await db.transaction(async (tx) => {
    await tx.execute(sql`
      select set_config('app.active_user_id', ${userId}, true);
    `);

    return queryFn(tx);
  });
}
