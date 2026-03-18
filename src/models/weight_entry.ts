import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWeightEntry extends Document {
  weight: number;
  bmi: number;
  date: Date;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WeightEntrySchema = new Schema<IWeightEntry>(
  {
    weight: {
      type: Number,
      required: [true, "Weight is required"],
      min: [1, "Weight must be positive"],
    },
    bmi: {
      type: Number,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const WeightEntry: Model<IWeightEntry> =
  mongoose.models.WeightEntry ||
  mongoose.model<IWeightEntry>("WeightEntry", WeightEntrySchema);

export default WeightEntry;
