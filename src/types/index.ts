import { ExtractTablesWithRelations } from "drizzle-orm";
import { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import { PgTransaction } from "drizzle-orm/pg-core";

export type DatabaseTransaction = PgTransaction<
  NodePgQueryResultHKT,
  typeof import("@/lib/drizzle/schema"),
  ExtractTablesWithRelations<typeof import("@/lib/drizzle/schema")>
>;
