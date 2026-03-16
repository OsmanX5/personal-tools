import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFuturePlan extends Document {
  name: string;
  description?: string;
  estimatedCost: number;
  amountSaved: number;
  currency: string;
  targetDate?: Date;
  priority: "High" | "Medium" | "Low";
  status: "Active" | "Completed" | "Cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const FuturePlanSchema = new Schema<IFuturePlan>(
  {
    name: {
      type: String,
      required: [true, "Plan name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    estimatedCost: {
      type: Number,
      required: [true, "Estimated cost is required"],
      min: [0, "Estimated cost must be non-negative"],
    },
    amountSaved: {
      type: Number,
      default: 0,
      min: [0, "Amount saved must be non-negative"],
    },
    currency: {
      type: String,
      enum: ["USD", "SAR", "EUR"],
      default: "USD",
    },
    targetDate: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Active", "Completed", "Cancelled"],
      default: "Active",
    },
  },
  { timestamps: true },
);

const FuturePlan: Model<IFuturePlan> =
  mongoose.models.FuturePlan ||
  mongoose.model<IFuturePlan>("FuturePlan", FuturePlanSchema);

export default FuturePlan;
