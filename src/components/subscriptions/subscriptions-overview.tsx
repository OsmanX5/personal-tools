import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CURRENCY_SYMBOLS,
  type Currency,
  type ExchangeRates,
} from "@/lib/networth-types";
import { type Subscription, toMonthlyAmount } from "@/lib/subscriptions-types";

interface SubscriptionsOverviewProps {
  subscriptions: Subscription[];
  displayCurrency: Currency;
  exchangeRates: ExchangeRates;
}

export function SubscriptionsOverview({
  subscriptions,
  displayCurrency,
  exchangeRates,
}: SubscriptionsOverviewProps) {
  const active = subscriptions.filter((sub) => sub.status === "Active");
  const paused = subscriptions.filter((sub) => sub.status === "Paused");
  const cancelled = subscriptions.filter((sub) => sub.status === "Cancelled");

  const monthlyTotal = active.reduce((sum, sub) => {
    const monthly = toMonthlyAmount(sub.amount, sub.billingCycle);
    const inUsd = monthly / exchangeRates[sub.currency];
    return sum + inUsd * exchangeRates[displayCurrency];
  }, 0);

  const symbol = CURRENCY_SYMBOLS[displayCurrency] ?? displayCurrency;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{subscriptions.length}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Active</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600">
            {active.length}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Paused / Cancelled
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">
            {paused.length + cancelled.length}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Monthly Equivalent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {symbol}
            {monthlyTotal.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            Across active subscriptions ({displayCurrency})
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
