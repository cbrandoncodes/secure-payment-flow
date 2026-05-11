import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  pgEnum,
  integer,
  uuid,
  check,
  unique,
} from "drizzle-orm/pg-core";

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "pending",
  "active",
  "on_hold",
  "cancelled",
  "failed",
  "expired",
]);

export const subscriptionTimelineEnum = pgEnum("subscription_timeline", [
  "monthly",
  "annually",
]);

export const planTypeEnum = pgEnum("account_type", [
  "free",
  "pro",
  "enterprise",
]);

const id = uuid("id")
  .primaryKey()
  .default(sql`gen_random_uuid()`);
const createdAt = timestamp("created_at").notNull().defaultNow();
const modifiedAt = timestamp("modified_at")
  .notNull()
  .defaultNow()
  .$onUpdateFn(() => sql`now()`);

// entities

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const billingProfiles = pgTable("billing_profiles", {
  id,
  userId: text("user_id").references(() => user.id, {
    onDelete: "cascade",
  }),
  createdAt,
  modifiedAt,
  country: text("country"),
  state: text("state"),
  city: text("city"),
  zipcode: text("zipcode"),
  street: text("street"),
});

export const subscriptions = pgTable(
  "subscriptions",
  {
    id,
    userId: text("user_id")
      .references(() => user.id, {
        onDelete: "cascade",
      })
      .unique(),

    // dodopayments
    dodoCustomerId: text("dodo_customer_id"),
    dodoPlanId: text("dodo_plan_id"),
    dodoSubscriptionId: text("dodo_subscription_id").unique(),
    dodoPaymentLink: text("dodo_payment_link"),
    dodoPaymentExpiresAt: timestamp("dodo_payment_expires_at"),

    // core
    trialPeriodEnd: timestamp("trial_period_end"),
    status: subscriptionStatusEnum("status"),
    periodEnd: timestamp("period_end"),
    periodStart: timestamp("period_start"),
    plan: planTypeEnum("plan").notNull(),
    isRenewing: boolean("is_renewing").default(true),

    // current billing cycle
    timeline: subscriptionTimelineEnum("timeline"),

    // pending deferred plan change
    pendingPlanId: text("pending_plan_id"),
    pendingPlan: planTypeEnum("pending_plan"),
    pendingPlanEffectiveDate: timestamp("pending_plan_effective_date"),
    pendingTimeline: subscriptionTimelineEnum("pending_timeline"),

    // dunning
    paymentFailureCount: integer("payment_failure_count").default(0),
    paymentFailureFirstAt: timestamp("payment_failure_first_at"),

    createdAt,
    modifiedAt,
  },
  (table) => [
    // pending-change fields must all be set together or all be null
    check(
      "pending_fields_atomicity",
      sql`(${table.pendingPlanId} IS NULL) = (${table.pendingPlan} IS NULL)
      AND (${table.pendingPlan} IS NULL) = (${table.pendingPlanEffectiveDate} IS NULL)
      AND (${table.pendingPlanEffectiveDate} IS NULL) = (${table.pendingTimeline} IS NULL)`,
    ),
  ],
);

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id,
    eventId: text("event_id").notNull(),
    eventType: text("event_type").notNull(),
    processedAt: timestamp("processed_at").notNull().defaultNow(),
  },
  (table) => [unique().on(table.eventId, table.eventType)],
);

// relations

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export type InsertUser = typeof user.$inferInsert;
export type SelectUser = typeof user.$inferSelect;

export type InsertSubscription = typeof subscriptions.$inferInsert;
export type SelectSubscription = typeof subscriptions.$inferSelect;

export type InsertBillingProfile = typeof billingProfiles.$inferInsert;
export type SelectBillingProfile = typeof billingProfiles.$inferSelect;

export type InsertWebhookEvent = typeof webhookEvents.$inferInsert;
export type SelectWebhookEvent = typeof webhookEvents.$inferSelect;
