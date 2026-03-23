import mongoose, { Schema, Document, Model } from "mongoose";

export interface IIncomeStream extends Document {
  name: string;
  type: string;
  defaultAmount: number;
  currency: string;
  isActive: boolean;
  startDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const IncomeStreamSchema = new Schema<IIncomeStream>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["Salary", "Freelance", "Other"],
      required: [true, "Type is required"],
    },
    defaultAmount: {
      type: Number,
      required: [true, "Default amount is required"],
      min: [0, "Default amount must be non-negative"],
    },
    currency: {
      type: String,
      enum: ["USD", "SAR", "EUR"],
      default: "USD",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
    },
  },
  { timestamps: true },
);

const IncomeStream: Model<IIncomeStream> =
  mongoose.models.IncomeStream ||
  mongoose.model<IIncomeStream>("IncomeStream", IncomeStreamSchema);

export default IncomeStream;
