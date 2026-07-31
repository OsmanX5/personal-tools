import type { Asset, Currency, ExchangeRates } from "@/lib/networth-types";

/**
 * Value of an asset at a point in time.
 *
 * Assets are recorded as dated snapshots rather than deltas, so the value at
 * any date is simply the most recent snapshot at or before that date. Before
 * the asset was acquired it contributes nothing; sold assets contribute
 * nothing at all.
 */
export function assetValueAt(asset: Asset, at: Date): number {
  if (asset.status === "sold") return 0;

  const acquired = new Date(asset.acquisitionDate ?? asset.createdAt);
  if (acquired > at) return 0;

  const entries = (asset.valueHistory ?? [])
    .map((e) => ({ date: new Date(e.date), value: e.value }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (entries.length === 0) return asset.value;

  // Fall back to the earliest snapshot for dates between acquisition and the
  // first recorded value.
  let value = entries[0].value;
  for (const entry of entries) {
    if (entry.date > at) break;
    value = entry.value;
  }
  return value;
}

/** Current value of an asset, or 0 if it has been sold. */
export function assetCurrentValue(asset: Asset): number {
  return asset.status === "sold" ? 0 : asset.value;
}

/** Sum of owned asset values, converted to `displayCurrency`. */
export function sumAssets(
  assets: Asset[],
  displayCurrency: Currency,
  rates: ExchangeRates,
  at?: Date,
): number {
  return assets.reduce((sum, asset) => {
    const value = at ? assetValueAt(asset, at) : assetCurrentValue(asset);
    const from = asset.currency ?? "USD";
    if (from === displayCurrency) return sum + value;
    return sum + (value / rates[from]) * rates[displayCurrency];
  }, 0);
}
