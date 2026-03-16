/**
 * Example Mongoose Model
 * ----------------------
 * Copy this file and rename it to create a new model for your tool.
 *
 * Steps:
 * 1. Copy this file: cp _example.ts my-model.ts
 * 2. Rename the interface, schema, and model name
 * 3. Adjust the fields to match your data
 * 4. Import and use in your API routes
 *
 * See the Mongoose docs for field types:
 * https://mongoosejs.com/docs/schematypes.html
 */

import mongoose, { Schema, Document, Model } from "mongoose";

// 1. Define a TypeScript interface for your document
export interface INetWorthAccount extends Document {
  name: string;
  description?: string;
  status: "active" | "archived";
  amount: number;
  currency: CurrencyType;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  purpose: AccountPurpose;
  location: AccountLocation;
  liquidity: AccountLiquidity;
  transactions: Transaction[];
}
export interface Transaction {
  date: Date;
  amount: number;
  type: TransactionType;
}
export enum AccountPurpose {
  Savings = "Savings",
  Current = "Current",
  Investment = "Investment",
  Other = "Other",
}
export enum AccountLocation {
  Bank = "Bank",
  Cash = "Cash",
  OnlineOutlet = "Online outlet",
  InvestmentApp = "Investment App",
  Other = "Other",
}
export enum AccountLiquidity {
  Immediate = "Immediate",
  Hours = "Hours",
  Days = "Days",
  Weeks = "Weeks",
}
export enum CurrencyType {
  USD = "USD",
  SAR = "SAR",
  EUR = "EUR",
}
export enum TransactionType {
  Income = "Income",
  Expense = "Expense",
  Transfer = "Transfer",
  MarketChange = "MarketChange",
}
const TransactionSchema = new Schema<Transaction>(
  {
    amount: {
      type: Number,
      required: [true, "Amount is required"],
    },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: true,
    },
  },
  { _id: true, timestamps: { createdAt: "date", updatedAt: false } },
);
// 2. Define the Mongoose schema
const NetWorthAccountSchema = new Schema<INetWorthAccount>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },
    amount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      enum: Object.values(CurrencyType),
      default: CurrencyType.USD,
    },
    tags: {
      type: [String],
      default: [],
    },
    purpose: {
      type: String,
      enum: Object.values(AccountPurpose),
      required: true,
    },
    location: {
      type: String,
      enum: Object.values(AccountLocation),
      required: true,
    },
    liquidity: {
      type: String,
      enum: Object.values(AccountLiquidity),
      required: true,
    },
    transactions: {
      type: [TransactionSchema],
      default: [],
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true,
  },
);

// 3. Export the model (with protection against re-compilation in dev)
const NetWorthAccount: Model<INetWorthAccount> =
  mongoose.models.NetWorthAccount ||
  mongoose.model<INetWorthAccount>("NetWorthAccount", NetWorthAccountSchema);

export default NetWorthAccount;
