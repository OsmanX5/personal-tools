export type AccountPurpose = "Savings" | "Current" | "Investment" | "Other";
export type AccountLocation =
  | "Bank"
  | "Cash"
  | "Investment App"
  | "Online outlet"
  | "Other";
export type AccountLiquidity = "Immediate" | "Hours" | "Days" | "Weeks";
export type TransactionType =
  | "Income"
  | "Expense"
  | "Transfer"
  | "MarketChange";
export type AccountStatus = "active" | "archived";
export type Currency = "USD" | "SAR" | "EUR";

export const ACCOUNT_PURPOSES: AccountPurpose[] = [
  "Savings",
  "Current",
  "Investment",
  "Other",
];
export const ACCOUNT_LOCATIONS: AccountLocation[] = [
  "Bank",
  "Cash",
  "Investment App",
  "Online outlet",
  "Other",
];
export const ACCOUNT_LIQUIDITIES: AccountLiquidity[] = [
  "Immediate",
  "Hours",
  "Days",
  "Weeks",
];
export const TRANSACTION_TYPES: TransactionType[] = [
  "Income",
  "Expense",
  "Transfer",
  "MarketChange",
];
export const CURRENCIES: Currency[] = ["USD", "SAR", "EUR"];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  SAR: "",
  EUR: "€",
};

export type ExchangeRates = Record<Currency, number>;

export interface TransactionData {
  _id: string;
  date: string;
  amount: number;
  type: TransactionType;
}

export interface FinanceAccount {
  _id: string;
  name: string;
  description?: string;
  status: AccountStatus;
  amount: number;
  currency: Currency;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  purpose: AccountPurpose;
  location: AccountLocation;
  liquidity: AccountLiquidity;
  transactions: TransactionData[];
}

export type FinanceAccountFormData = Omit<
  FinanceAccount,
  "_id" | "createdAt" | "updatedAt" | "transactions"
>;

export const PURPOSE_COLORS: Record<AccountPurpose, string> = {
  Savings:
    "bg-green-50 border-green-200 dark:bg-green-950/40 dark:border-green-900",
  Current:
    "bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-900",
  Investment:
    "bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:border-purple-900",
  Other: "bg-gray-50 border-gray-200 dark:bg-gray-950/40 dark:border-gray-900",
};

export const LIQUIDITY_BADGE: Record<AccountLiquidity, string> = {
  Immediate:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Hours:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Days: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  Weeks: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};
