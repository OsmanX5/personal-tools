import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICategoryBudget extends Document {
  category: string;
  limitAmount: number;
  currency: string;
  month: number;
  year: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategoryBudgetSchema = new Schema<ICategoryBudget>(
  {
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
    limitAmount: {
      type: Number,
      required: [true, "Budget limit is required"],
      min: [0, "Budget limit must be non-negative"],
    },
    currency: {
      type: String,
      enum: ["USD", "SAR", "EUR"],
      default: "USD",
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

CategoryBudgetSchema.index({ category: 1, month: 1, year: 1 }, { unique: true });

const CategoryBudget: Model<ICategoryBudget> =
  mongoose.models.CategoryBudget ||
  mongoose.model<ICategoryBudget>("CategoryBudget", CategoryBudgetSchema);

export default CategoryBudget;
