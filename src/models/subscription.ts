import mongoose, { Document, Model, Schema } from "mongoose";

export interface ISubscription extends Document {
  name: string;
  description: string;
  amount: number;
  currency: "USD" | "SAR" | "EUR";
  billingCycle: "Weekly" | "Monthly" | "Every 6 Months" | "Yearly";
  nextRenewalDate: Date;
  status: "Active" | "Paused" | "Cancelled";
  autoRenew: boolean;
  reminderLead: number;
  reminderUnit: "days" | "weeks";
  tags: string[];
  budgetExpenseId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
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
    billingCycle: {
      type: String,
      enum: ["Weekly", "Monthly", "Every 6 Months", "Yearly"],
      required: [true, "Billing cycle is required"],
      default: "Monthly",
    },
    nextRenewalDate: {
      type: Date,
      required: [true, "Next renewal date is required"],
    },
    status: {
      type: String,
      enum: ["Active", "Paused", "Cancelled"],
      default: "Active",
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
    reminderLead: {
      type: Number,
      min: [0, "Reminder lead must be non-negative"],
      default: 3,
    },
    reminderUnit: {
      type: String,
      enum: ["days", "weeks"],
      default: "days",
    },
    tags: {
      type: [String],
      default: [],
    },
    budgetExpenseId: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

SubscriptionSchema.index({ status: 1, nextRenewalDate: 1 });
SubscriptionSchema.index({ tags: 1 });

const Subscription: Model<ISubscription> =
  mongoose.models.Subscription ||
  mongoose.model<ISubscription>("Subscription", SubscriptionSchema);

export default Subscription;
