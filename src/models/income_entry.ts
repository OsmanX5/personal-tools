import mongoose, { Schema, Document, Model } from "mongoose";

export interface IIncomeEntry extends Document {
  streamId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  month: number;
  year: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const IncomeEntrySchema = new Schema<IIncomeEntry>(
  {
    streamId: {
      type: Schema.Types.ObjectId,
      ref: "IncomeStream",
      required: [true, "Stream ID is required"],
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
    month: {
      type: Number,
      required: [true, "Month is required"],
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

IncomeEntrySchema.index({ streamId: 1, month: 1, year: 1 }, { unique: true });

const IncomeEntry: Model<IIncomeEntry> =
  mongoose.models.IncomeEntry ||
  mongoose.model<IIncomeEntry>("IncomeEntry", IncomeEntrySchema);

export default IncomeEntry;
