import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { createDb } from "./client";
import { batchItems, batches, users } from "./schema";

/**
 * Needs the local Postgres (docker compose up -d) and applied migrations.
 * Everything runs inside a transaction that is rolled back, so no test data is left behind.
 */
const { db, close } = createDb();
afterAll(() => close());

const metaUserId = `test-user-${Date.now()}`;

describe("database schema", () => {
  it("stores a batch with one item and reads it back", async () => {
    let readBack: { batch: typeof batches.$inferSelect; item: typeof batchItems.$inferSelect }[] = [];

    await expect(
      db.transaction(async (tx) => {
        const [user] = await tx.insert(users).values({ metaUserId, name: "Test User" }).returning();
        const [batch] = await tx
          .insert(batches)
          .values({
            userId: user.id,
            adAccountId: "act_123",
            mode: "ad_set",
            sourceCampaignId: "c_1",
            sourceAdSetId: "as_1",
            budgetLevel: "ad_set",
            budgetType: "daily",
            budgetAmountMinor: 5000,
            startAt: new Date("2026-12-01T00:00:00Z"),
            adSetNamePattern: [{ kind: "text", value: "Test" }],
          })
          .returning();
        await tx.insert(batchItems).values({
          batchId: batch.id,
          position: 1,
          postUrl: "https://www.facebook.com/example/posts/1",
        });

        readBack = await tx
          .select({ batch: batches, item: batchItems })
          .from(batches)
          .innerJoin(batchItems, eq(batchItems.batchId, batches.id))
          .where(eq(batches.id, batch.id));

        tx.rollback();
      }),
    ).rejects.toThrow();

    expect(readBack).toHaveLength(1);
    expect(readBack[0].batch.status).toBe("draft");
    expect(readBack[0].batch.budgetAmountMinor).toBe(5000);
    expect(readBack[0].item.position).toBe(1);
    expect(readBack[0].item.step).toBe("pending");
  });

  it("leaves no test data behind", async () => {
    const rows = await db.select().from(users).where(eq(users.metaUserId, metaUserId));
    expect(rows).toEqual([]);
  });
});
