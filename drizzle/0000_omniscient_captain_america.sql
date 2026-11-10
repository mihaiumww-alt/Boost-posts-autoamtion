CREATE TYPE "public"."batch_mode" AS ENUM('ad_set', 'campaign');--> statement-breakpoint
CREATE TYPE "public"."batch_status" AS ENUM('draft', 'running', 'paused_for_reconnect', 'completed', 'completed_with_errors');--> statement-breakpoint
CREATE TYPE "public"."budget_level" AS ENUM('campaign', 'ad_set');--> statement-breakpoint
CREATE TYPE "public"."budget_type" AS ENUM('daily', 'lifetime');--> statement-breakpoint
CREATE TYPE "public"."connection_status" AS ENUM('active', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."item_step" AS ENUM('pending', 'copied', 'overridden', 'creative_created', 'ad_created', 'verified_paused', 'failed');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('facebook', 'instagram');--> statement-breakpoint
CREATE TYPE "public"."post_format" AS ENUM('image', 'video', 'reel', 'carousel');--> statement-breakpoint
CREATE TABLE "ad_account_refs" (
	"meta_account_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"currency" text NOT NULL,
	"timezone" text NOT NULL,
	"owning_business_id" text,
	"refreshed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batch_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"post_url" text NOT NULL,
	"platform" "platform",
	"resolved_post_id" text,
	"post_format" "post_format",
	"ad_set_name" text,
	"campaign_name" text,
	"step" "item_step" DEFAULT 'pending' NOT NULL,
	"failed_step" text,
	"created_campaign_id" text,
	"created_ad_set_id" text,
	"created_creative_id" text,
	"created_ad_id" text,
	"meta_error_code" integer,
	"meta_error_subcode" integer,
	"meta_error_message" text,
	"review_status" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "batch_items_batch_position" UNIQUE("batch_id","position")
);
--> statement-breakpoint
CREATE TABLE "batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"ad_account_id" text NOT NULL,
	"mode" "batch_mode" NOT NULL,
	"source_campaign_id" text NOT NULL,
	"source_ad_set_id" text,
	"budget_level" "budget_level" NOT NULL,
	"budget_type" "budget_type",
	"budget_amount_minor" bigint,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone,
	"ad_set_name_pattern" jsonb NOT NULL,
	"campaign_name_pattern" jsonb,
	"status" "batch_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meta_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"encrypted_token" text NOT NULL,
	"granted_scopes" text[] DEFAULT '{}' NOT NULL,
	"expires_at" timestamp with time zone,
	"status" "connection_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "meta_connections_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meta_user_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_meta_user_id_unique" UNIQUE("meta_user_id")
);
--> statement-breakpoint
ALTER TABLE "batch_items" ADD CONSTRAINT "batch_items_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_connections" ADD CONSTRAINT "meta_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;