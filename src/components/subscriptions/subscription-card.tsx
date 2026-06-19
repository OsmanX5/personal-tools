import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CURRENCY_SYMBOLS,
  type Currency,
  type ExchangeRates,
} from "@/lib/networth-types";
import {
  STATUS_COLORS,
  type Subscription,
  toMonthlyAmount,
} from "@/lib/subscriptions-types";

interface SubscriptionCardProps {
  subscription: Subscription;
  displayCurrency: Currency;
  exchangeRates: ExchangeRates;
  onEdit: (subscription: Subscription) => void;
  onDelete: (id: string) => void;
}

const dateFmt = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function SubscriptionCard({
  subscription,
  displayCurrency,
  exchangeRates,
  onEdit,
  onDelete,
}: SubscriptionCardProps) {
  const sourceSymbol =
    CURRENCY_SYMBOLS[subscription.currency] ?? subscription.currency;
  const displaySymbol = CURRENCY_SYMBOLS[displayCurrency] ?? displayCurrency;

  const convertedAmount =
    (subscription.amount / exchangeRates[subscription.currency]) *
    exchangeRates[displayCurrency];
  const monthlyEquivalent = toMonthlyAmount(
    subscription.amount,
    subscription.billingCycle,
  );
  const convertedMonthlyEquivalent =
    (monthlyEquivalent / exchangeRates[subscription.currency]) *
    exchangeRates[displayCurrency];

  return (
    <Card className="h-full">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{subscription.name}</CardTitle>
          <Badge className={STATUS_COLORS[subscription.status]}>
            {subscription.status}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          Renews on {dateFmt.format(new Date(subscription.nextRenewalDate))}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Amount</p>
            <p className="font-semibold">
              {displaySymbol}
              {convertedAmount.toFixed(2)} {displayCurrency}
            </p>
            {displayCurrency !== subscription.currency && (
              <p className="text-xs text-muted-foreground">
                {sourceSymbol}
                {subscription.amount.toFixed(2)} {subscription.currency}
              </p>
            )}
          </div>
          <div>
            <p className="text-muted-foreground">Cycle</p>
            <p className="font-semibold">{subscription.billingCycle}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Monthly eq.</p>
            <p className="font-semibold">
              {displaySymbol}
              {convertedMonthlyEquivalent.toFixed(2)} {displayCurrency}
            </p>
            {displayCurrency !== subscription.currency && (
              <p className="text-xs text-muted-foreground">
                {sourceSymbol}
                {monthlyEquivalent.toFixed(2)} {subscription.currency}
              </p>
            )}
          </div>
          <div>
            <p className="text-muted-foreground">Reminder</p>
            <p className="font-semibold">
              {subscription.reminderLead} {subscription.reminderUnit}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {subscription.autoRenew && (
            <Badge variant="outline">Auto-renew</Badge>
          )}
          {subscription.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              #{tag}
            </Badge>
          ))}
        </div>

        {subscription.description && (
          <p className="text-sm text-muted-foreground">
            {subscription.description}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(subscription)}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(subscription._id)}
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
