CREATE TYPE "public"."account_type" AS ENUM('free', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('pending', 'active', 'on_hold', 'cancelled', 'failed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."subscription_timeline" AS ENUM('monthly', 'annually');--> statement-breakpoint
CREATE TABLE "billing_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"modified_at" timestamp DEFAULT now() NOT NULL,
	"country" text,
	"state" text,
	"city" text,
	"zipcode" text,
	"street" text
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"dodo_customer_id" text,
	"dodo_plan_id" text,
	"dodo_subscription_id" text,
	"dodo_payment_link" text,
	"dodo_payment_expires_at" timestamp,
	"trial_period_end" timestamp,
	"status" "subscription_status",
	"period_end" timestamp,
	"period_start" timestamp,
	"plan" "account_type" NOT NULL,
	"is_renewing" boolean DEFAULT true,
	"timeline" "subscription_timeline",
	"pending_plan_id" text,
	"pending_plan" "account_type",
	"pending_plan_effective_date" timestamp,
	"pending_timeline" "subscription_timeline",
	"payment_failure_count" integer DEFAULT 0,
	"payment_failure_first_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"modified_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "subscription_dodo_subscription_id_unique" UNIQUE("dodo_subscription_id"),
	CONSTRAINT "pending_fields_atomicity" CHECK (("subscription"."pending_plan_id" IS NULL) = ("subscription"."pending_plan" IS NULL)
      AND ("subscription"."pending_plan" IS NULL) = ("subscription"."pending_plan_effective_date" IS NULL)
      AND ("subscription"."pending_plan_effective_date" IS NULL) = ("subscription"."pending_timeline" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"processed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "webhook_events_event_id_event_type_unique" UNIQUE("event_id","event_type")
);
--> statement-breakpoint
ALTER TABLE "billing_profile" ADD CONSTRAINT "billing_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;