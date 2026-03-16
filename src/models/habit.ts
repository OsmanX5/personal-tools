import mongoose, { Schema, Document, Model } from "mongoose";

export interface IHabit extends Document {
  name: string;
  description?: string;
  color: string;
  category?: string;
  frequency: "daily" | "weekly" | "biweekly" | "monthly" | "custom";
  frequencyInterval?: number;
  hasValue: boolean;
  targetValue?: number;
  unit?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HabitSchema = new Schema<IHabit>(
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
    color: {
      type: String,
      required: [true, "Color is required"],
      default: "#3b82f6",
    },
    category: {
      type: String,
      trim: true,
    },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "biweekly", "monthly", "custom"],
      required: [true, "Frequency is required"],
      default: "daily",
    },
    frequencyInterval: {
      type: Number,
      min: [1, "Interval must be at least 1"],
    },
    hasValue: {
      type: Boolean,
      default: false,
    },
    targetValue: {
      type: Number,
      min: [0, "Target value must be positive"],
    },
    unit: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

const Habit: Model<IHabit> =
  mongoose.models.Habit || mongoose.model<IHabit>("Habit", HabitSchema);

export default Habit;
