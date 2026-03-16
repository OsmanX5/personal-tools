import { NextResponse } from "next/server";

const SUPPORTED_CURRENCIES = ["USD", "SAR", "EUR"];

// Cache exchange rates in memory for 1 hour
let cachedRates: Record<string, number> | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

export async function GET() {
  const now = Date.now();

  if (cachedRates && now - cacheTimestamp < CACHE_DURATION_MS) {
    return NextResponse.json(cachedRates);
  }

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error("Failed to fetch exchange rates");

    const data = await res.json();
    const rates: Record<string, number> = {};

    for (const currency of SUPPORTED_CURRENCIES) {
      rates[currency] = data.rates[currency] ?? 1;
    }

    cachedRates = rates;
    cacheTimestamp = now;

    return NextResponse.json(rates);
  } catch {
    // Return fallback rates if API fails
    return NextResponse.json(
      { USD: 1, SAR: 3.75, EUR: 0.92 },
      { status: cachedRates ? 200 : 502 },
    );
  }
}
