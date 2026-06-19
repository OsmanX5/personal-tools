import Expense from "@/models/expense";
import type { ISubscription } from "@/models/subscription";
import type { RecurringFrequency } from "@/lib/budget-types";

function toRecurringFrequency(
  cycle: ISubscription["billingCycle"],
): RecurringFrequency {
  if (cycle === "Weekly") return "Weekly";
  if (cycle === "Monthly") return "Monthly";
  if (cycle === "Every 6 Months") return "Every 6 Months";
  return "Yearly";
}

function buildDescription(subscription: ISubscription): string {
  const base = `Subscription: ${subscription.name}`;
  if (!subscription.description) return base;
  return `${base} - ${subscription.description}`;
}

export async function syncSubscriptionToBudget(subscription: ISubscription) {
  const shouldBeSynced = subscription.status === "Active";

  if (!shouldBeSynced) {
    if (subscription.budgetExpenseId) {
      await Expense.findByIdAndDelete(subscription.budgetExpenseId);
      subscription.budgetExpenseId = undefined;
      await subscription.save();
    }
    return;
  }

  const payload = {
    amount: subscription.amount,
    currency: subscription.currency,
    category: "Subscriptions",
    description: buildDescription(subscription),
    date: subscription.nextRenewalDate,
    recurring: true,
    recurringFrequency: toRecurringFrequency(subscription.billingCycle),
  };

  if (subscription.budgetExpenseId) {
    const updated = await Expense.findByIdAndUpdate(
      subscription.budgetExpenseId,
      payload,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updated) {
      const created = await Expense.create(payload);
      subscription.budgetExpenseId = String(created._id);
      await subscription.save();
    }
    return;
  }

  const created = await Expense.create(payload);
  subscription.budgetExpenseId = String(created._id);
  await subscription.save();
}

export async function deleteSubscriptionBudgetLink(
  subscription: ISubscription,
) {
  if (!subscription.budgetExpenseId) return;
  await Expense.findByIdAndDelete(subscription.budgetExpenseId);
}
