import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import IncomeEntry from "@/models/income_entry";
import IncomeStream from "@/models/income_stream";

const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  SAR: 3.75,
  EUR: 0.92,
};

function convert(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>,
) {
  if (from === to) return amount;
  const inUsd = amount / (rates[from] || 1);
  return inUsd * (rates[to] || 1);
}

async function fetchRates(): Promise<Record<string, number>> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return FALLBACK_RATES;
    const data = await res.json();
    return {
      USD: data.rates.USD ?? 1,
      SAR: data.rates.SAR ?? 3.75,
      EUR: data.rates.EUR ?? 0.92,
    };
  } catch {
    return FALLBACK_RATES;
  }
}

export async function GET(request: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const dc = searchParams.get("displayCurrency") || "SAR";
  const monthsParam = searchParams.get("months");
  const count = monthsParam
    ? Math.min(Math.max(parseInt(monthsParam, 10), 1), 24)
    : 6;

  const rates = await fetchRates();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Build query for current month + past N-1 months
  const conditions: { month: number; year: number }[] = [];
  for (let i = 0; i < count; i++) {
    let m = currentMonth - i;
    let y = currentYear;
    while (m <= 0) {
      m += 12;
      y -= 1;
    }
    conditions.push({ month: m, year: y });
  }

  const entries = await IncomeEntry.find({ $or: conditions });
  const streams = await IncomeStream.find({ isActive: true });

  // Aggregate totals per month
  const totals = new Map<
    string,
    { month: number; year: number; total: number }
  >();
  for (const cond of conditions) {
    const key = `${cond.year}-${cond.month}`;
    totals.set(key, { month: cond.month, year: cond.year, total: 0 });
  }

  // Build a set of (streamId, month, year) tuples for persisted entries
  const persistedKeys = new Set<string>();
  for (const e of entries) {
    const key = `${e.year}-${e.month}`;
    const bucket = totals.get(key);
    if (bucket) {
      bucket.total += convert(e.amount, e.currency, dc, rates);
    }
    persistedKeys.add(`${e.streamId}-${e.month}-${e.year}`);
  }

  // Fill in virtual entries from streams that have no persisted entry
  for (const cond of conditions) {
    const key = `${cond.year}-${cond.month}`;
    const bucket = totals.get(key)!;
    for (const s of streams) {
      const rec = s.recurrence ?? "recurring";
      // One-time streams only count in their designated month
      if (rec === "one-time") {
        if (s.oneTimeMonth !== cond.month || s.oneTimeYear !== cond.year)
          continue;
      }
      // Skip if a persisted entry already exists for this stream+month
      if (persistedKeys.has(`${s._id}-${cond.month}-${cond.year}`)) continue;
      bucket.total += convert(s.defaultAmount, s.currency, dc, rates);
    }
  }

  // Sort chronologically and add labels
  const history = Array.from(totals.values())
    .sort((a, b) => a.year - b.year || a.month - b.month)
    .map((d) => ({
      month: d.month,
      year: d.year,
      label: new Date(d.year, d.month - 1).toLocaleDateString(undefined, {
        month: "short",
        year: "2-digit",
      }),
      total: Math.round(d.total * 100) / 100,
    }));

  return NextResponse.json({ history });
}
