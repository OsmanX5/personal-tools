import mongoose, { Schema, Document, Model } from "mongoose";

export interface IHabitLog extends Document {
  habitId: mongoose.Types.ObjectId;
  /** Midnight UTC of the logged day */
  date: Date;
  value?: number;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HabitLogSchema = new Schema<IHabitLog>(
  {
    habitId: {
      type: Schema.Types.ObjectId,
      ref: "Habit",
      required: [true, "Habit ID is required"],
      index: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      index: true,
    },
    value: {
      type: Number,
    },
    note: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

// Compound index: one log per habit per day (enforced at app level; index speeds queries)
HabitLogSchema.index({ habitId: 1, date: 1 });

const HabitLog: Model<IHabitLog> =
  mongoose.models.HabitLog ||
  mongoose.model<IHabitLog>("HabitLog", HabitLogSchema);

export default HabitLog;
