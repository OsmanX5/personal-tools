import mongoose, { Schema, Document, Model } from "mongoose";

export interface IExpense extends Document {
  amount: number;
  currency: string;
  category: string;
  description?: string;
  date: Date;
  recurring: boolean;
  recurringFrequency?: string;
  withdrawAccountId?: string;
  // Recurring series fields
  recurringParentId?: string; // set on override/skip docs — references the template _id
  recurringEndDate?: Date; // set on templates — stop generating occurrences after this date
  skipped?: boolean; // set on skip docs — marks an occurrence as deliberately skipped
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount must be non-negative"],
    },
    currency: {
      type: String,
      enum: ["USD", "SAR", "EUR"],
      default: "USD",
    },
    category: {
      type: String,
      enum: [
        "Food & Groceries",
        "Transport",
        "Rent / Housing",
        "Utilities",
        "Entertainment",
        "Health & Fitness",
        "Education",
        "Clothing",
        "Subscriptions",
        "Loaning Friends",
        "Family Support",
        "Other",
      ],
      required: [true, "Category is required"],
    },
    description: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    recurring: {
      type: Boolean,
      default: false,
    },
    recurringFrequency: {
      type: String,
      enum: ["Weekly", "Monthly", "Every 6 Months", "Yearly"],
    },
    withdrawAccountId: {
      type: String,
    },
    // Recurring series fields
    recurringParentId: {
      type: String,
      index: true,
    },
    recurringEndDate: {
      type: Date,
    },
    skipped: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

ExpenseSchema.index({ date: -1 });
ExpenseSchema.index({ category: 1, date: -1 });
ExpenseSchema.index({ recurringParentId: 1, date: 1 });

const Expense: Model<IExpense> =
  mongoose.models.Expense || mongoose.model<IExpense>("Expense", ExpenseSchema);

export default Expense;
