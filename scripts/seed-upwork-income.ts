/**
 * Seed script: Create an "Upwork" income stream (variable, Freelance)
 * and insert monthly income entries from transaction history.
 *
 * Run with:
 *   npx tsx scripts/seed-upwork-income.ts
 */

import mongoose from "mongoose";
import IncomeStream from "../src/models/income_stream";
import IncomeEntry from "../src/models/income_entry";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "personal-tools";

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI environment variable is not set.");
  process.exit(1);
}

// Monthly Upwork withdrawal totals (excluding $1 fees) from transaction report
const MONTHLY_EARNINGS: { month: number; year: number; amount: number }[] = [
  { month: 7, year: 2024, amount: 93.5 },
  { month: 8, year: 2024, amount: 179.0 },
  { month: 11, year: 2024, amount: 79.1 },
  { month: 12, year: 2024, amount: 499.0 },
  { month: 1, year: 2025, amount: 948.9 },
  { month: 2, year: 2025, amount: 1730.25 },
  { month: 3, year: 2025, amount: 1065.5 },
  { month: 5, year: 2025, amount: 1057.0 },
  { month: 6, year: 2025, amount: 1199.0 },
  { month: 7, year: 2025, amount: 1500.0 },
  { month: 9, year: 2025, amount: 2216.52 },
  { month: 11, year: 2025, amount: 468.0 },
  { month: 12, year: 2025, amount: 2999.0 },
  { month: 3, year: 2026, amount: 1808.88 },
];

async function seed() {
  await mongoose.connect(MONGODB_URI as string, { dbName: MONGODB_DB_NAME });
  console.log(`Connected to database: ${MONGODB_DB_NAME}`);

  // Calculate average monthly earnings for the estimated amount
  const total = MONTHLY_EARNINGS.reduce((s, e) => s + e.amount, 0);
  const avg = Math.round(total / MONTHLY_EARNINGS.length);
  console.log(
    `Total earnings: $${total.toFixed(2)} over ${MONTHLY_EARNINGS.length} months (avg ~$${avg}/mo)`,
  );

  // 1. Create the Upwork income stream
  let stream = await IncomeStream.findOne({ name: "Upwork" });
  if (stream) {
    console.log(`Stream "Upwork" already exists (${stream._id}), reusing it.`);
  } else {
    stream = await IncomeStream.create({
      name: "Upwork",
      type: "Freelance",
      recurrence: "variable",
      defaultAmount: avg,
      currency: "USD",
      isActive: true,
    });
    console.log(`Created stream "Upwork" (${stream._id})`);
  }

  // 2. Upsert income entries for each month
  let created = 0;
  let updated = 0;
  for (const { month, year, amount } of MONTHLY_EARNINGS) {
    const result = await IncomeEntry.findOneAndUpdate(
      { streamId: stream._id, month, year },
      { streamId: stream._id, amount, currency: "USD", month, year },
      { new: true, upsert: true, runValidators: true },
    );
    if (result.createdAt.getTime() === result.updatedAt.getTime()) {
      created++;
    } else {
      updated++;
    }
    console.log(
      `  ${year}-${String(month).padStart(2, "0")}: $${amount.toFixed(2)}`,
    );
  }

  console.log(
    `\nDone! ${created} entries created, ${updated} entries updated.`,
  );
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
