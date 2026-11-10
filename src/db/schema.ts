import {
  bigint,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

/** The five stored entities from the MVP spec. */

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const connectionStatus = pgEnum("connection_status", ["active", "expired", "revoked"]);
export const batchMode = pgEnum("batch_mode", ["ad_set", "campaign"]);
export const budgetLevel = pgEnum("budget_level", ["campaign", "ad_set"]);
export const budgetType = pgEnum("budget_type", ["daily", "lifetime"]);
export const batchStatus = pgEnum("batch_status", [
  "draft",
  "running",
  "paused_for_reconnect",
  "completed",
  "completed_with_errors",
]);
export const platform = pgEnum("platform", ["facebook", "instagram"]);
export const postFormat = pgEnum("post_format", ["image", "video", "reel", "carousel"]);
export const itemStep = pgEnum("item_step", [
  "pending",
  "copied",
  "overridden",
  "creative_created",
  "ad_created",
  "verified_paused",
  "failed",
]);

/** A team member. Who may sign in is decided by ALLOWED_META_USER_IDS, not by this table. */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  metaUserId: text("meta_user_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email"),
  createdAt: createdAt(),
});

/** One Meta login per user. The token is stored encrypted (Step 6) and never sent to the browser. */
export const metaConnections = pgTable("meta_connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  encryptedToken: text("encrypted_token").notNull(),
  grantedScopes: text("granted_scopes").array().notNull().default([]),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  status: connectionStatus("status").notNull().default("active"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/** Cached ad account details. Access is always re-checked with Meta per user. */
export const adAccountRefs = pgTable("ad_account_refs", {
  metaAccountId: text("meta_account_id").primaryKey(),
  name: text("name").notNull(),
  currency: text("currency").notNull(),
  timezone: text("timezone").notNull(),
  owningBusinessId: text("owning_business_id"),
  refreshedAt: timestamp("refreshed_at", { withTimezone: true }).notNull().defaultNow(),
});

/** One run of the wizard. */
export const batches = pgTable("batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  adAccountId: text("ad_account_id").notNull(),
  mode: batchMode("mode").notNull(),
  sourceCampaignId: text("source_campaign_id").notNull(),
  sourceAdSetId: text("source_ad_set_id"),
  budgetLevel: budgetLevel("budget_level").notNull(),
  /** Null when the budget stays at campaign level in ad set mode (only dates are set). */
  budgetType: budgetType("budget_type"),
  /** In the ad account currency's smallest unit (e.g. bani for RON). */
  budgetAmountMinor: bigint("budget_amount_minor", { mode: "number" }),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }),
  adSetNamePattern: jsonb("ad_set_name_pattern").notNull(),
  campaignNamePattern: jsonb("campaign_name_pattern"),
  status: batchStatus("status").notNull().default("draft"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/** One pasted post link inside a batch. */
export const batchItems = pgTable(
  "batch_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),
    /** The n in the "-n" name suffix, 1-based. */
    position: integer("position").notNull(),
    postUrl: text("post_url").notNull(),
    platform: platform("platform"),
    resolvedPostId: text("resolved_post_id"),
    postFormat: postFormat("post_format"),
    /** The ad uses the same name as its ad set. */
    adSetName: text("ad_set_name"),
    campaignName: text("campaign_name"),
    step: itemStep("step").notNull().default("pending"),
    failedStep: text("failed_step"),
    createdCampaignId: text("created_campaign_id"),
    createdAdSetId: text("created_ad_set_id"),
    createdCreativeId: text("created_creative_id"),
    createdAdId: text("created_ad_id"),
    metaErrorCode: integer("meta_error_code"),
    metaErrorSubcode: integer("meta_error_subcode"),
    metaErrorMessage: text("meta_error_message"),
    reviewStatus: text("review_status"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [unique("batch_items_batch_position").on(t.batchId, t.position)],
);
