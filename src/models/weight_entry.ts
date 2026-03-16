import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWeightEntry extends Document {
  weight: number;
  height: number;
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
    height: {
      type: Number,
      required: [true, "Height is required"],
      min: [1, "Height must be positive"],
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

// Auto-calculate BMI before saving
WeightEntrySchema.pre("save", function () {
  const heightM = this.height / 100;
  if (heightM > 0) {
    this.bmi = Math.round((this.weight / (heightM * heightM)) * 100) / 100;
  }
});

// Also recalculate on findOneAndUpdate
WeightEntrySchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate() as Record<string, unknown> | null;
  if (
    update &&
    typeof update.weight === "number" &&
    typeof update.height === "number"
  ) {
    const heightM = update.height / 100;
    if (heightM > 0) {
      update.bmi =
        Math.round((update.weight / (heightM * heightM)) * 100) / 100;
    }
  }
});

const WeightEntry: Model<IWeightEntry> =
  mongoose.models.WeightEntry ||
  mongoose.model<IWeightEntry>("WeightEntry", WeightEntrySchema);

export default WeightEntry;
