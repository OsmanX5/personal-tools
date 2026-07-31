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

export interface NetWorthAccount {
  _id: string;
  name: string;
  description?: string;
  status: AccountStatus;
  amount: number;
  startBalance?: number;
  startDate?: string;
  currency: Currency;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  purpose: AccountPurpose;
  location: AccountLocation;
  liquidity: AccountLiquidity;
  transactions: TransactionData[];
}

export type NetWorthAccountFormData = Omit<
  NetWorthAccount,
  "_id" | "createdAt" | "updatedAt" | "transactions"
> & {
  startBalance: number;
  startDate: string;
};

/* --------------------------------------------------------------------------
 * Assets
 *
 * An asset is a store of value that is not a spendable account — property, a
 * vehicle, gold, equipment. Assets are tracked with dated value snapshots
 * instead of transactions, and are kept out of the account net worth total so
 * the liquid figure stays readable on its own.
 * ------------------------------------------------------------------------ */

export type AssetCategory =
  | "Property"
  | "Vehicle"
  | "Precious Metal"
  | "Equipment"
  | "Collectible"
  | "Other";
export type AssetStatus = "owned" | "sold";

export const ASSET_CATEGORIES: AssetCategory[] = [
  "Property",
  "Vehicle",
  "Precious Metal",
  "Equipment",
  "Collectible",
  "Other",
];

export interface AssetValueEntry {
  _id: string;
  date: string;
  value: number;
  note?: string;
}

export interface Asset {
  _id: string;
  name: string;
  description?: string;
  status: AssetStatus;
  value: number;
  currency: Currency;
  category: AssetCategory;
  acquisitionDate?: string;
  acquisitionCost?: number;
  tags: string[];
  valueHistory: AssetValueEntry[];
  createdAt: string;
  updatedAt: string;
}

export type AssetFormData = Omit<
  Asset,
  "_id" | "createdAt" | "updatedAt" | "valueHistory"
> & {
  acquisitionDate: string;
  acquisitionCost: number;
};

export const ASSET_CATEGORY_BORDER: Record<AssetCategory, string> = {
  Property: "border-l-amber-500",
  Vehicle: "border-l-cyan-500",
  "Precious Metal": "border-l-yellow-500",
  Equipment: "border-l-slate-500",
  Collectible: "border-l-pink-500",
  Other: "border-l-gray-500",
};

export const ASSET_CATEGORY_SELECTED: Record<AssetCategory, string> = {
  Property: "bg-amber-100 dark:bg-amber-900/30",
  Vehicle: "bg-cyan-100 dark:bg-cyan-900/30",
  "Precious Metal": "bg-yellow-100 dark:bg-yellow-900/30",
  Equipment: "bg-slate-100 dark:bg-slate-800/40",
  Collectible: "bg-pink-100 dark:bg-pink-900/30",
  Other: "bg-gray-100 dark:bg-gray-800/40",
};

export const PURPOSE_COLORS: Record<AccountPurpose, string> = {
  Savings:
    "bg-green-50 border-green-200 dark:bg-green-900/25 dark:border-green-700/50",
  Current:
    "bg-blue-50 border-blue-200 dark:bg-blue-900/25 dark:border-blue-700/50",
  Investment:
    "bg-purple-50 border-purple-200 dark:bg-purple-900/25 dark:border-purple-700/50",
  Other:
    "bg-gray-50 border-gray-200 dark:bg-gray-800/40 dark:border-gray-700/50",
};

export const LIQUIDITY_BADGE: Record<AccountLiquidity, string> = {
  Immediate:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
  Hours:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-200",
  Days: "bg-orange-100 text-orange-800 dark:bg-orange-500/12 dark:text-orange-200",
  Weeks: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
};
