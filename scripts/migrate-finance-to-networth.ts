/**
 * One-time migration script: rename MongoDB collection
 * "financeaccounts" → "networthaccounts"
 *
 * Run BEFORE deploying the renamed code:
 *   npx ts-node --project tsconfig.json scripts/migrate-finance-to-networth.ts
 *
 * Safe to run multiple times — it is a no-op if the old collection
 * no longer exists or the new collection already exists.
 */

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "personal-tools";

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI environment variable is not set.");
  process.exit(1);
}

async function migrate() {
  await mongoose.connect(MONGODB_URI as string, { dbName: MONGODB_DB_NAME });
  console.log(`Connected to database: ${MONGODB_DB_NAME}`);

  const db = mongoose.connection.db!;
  const collections = await db.listCollections().toArray();
  const names = collections.map((c) => c.name);

  if (!names.includes("financeaccounts")) {
    console.log("Collection 'financeaccounts' not found — nothing to migrate.");
    await mongoose.disconnect();
    return;
  }

  if (names.includes("networthaccounts")) {
    console.log(
      "Collection 'networthaccounts' already exists — skipping rename.",
    );
    await mongoose.disconnect();
    return;
  }

  await db.collection("financeaccounts").rename("networthaccounts");
  console.log("Successfully renamed 'financeaccounts' → 'networthaccounts'.");

  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
