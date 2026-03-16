import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWeightGoal extends Document {
  targetWeight: number;
  startWeight: number;
  targetDate?: Date;
  status: "Active" | "Achieved" | "Abandoned";
  createdAt: Date;
  updatedAt: Date;
}

const WeightGoalSchema = new Schema<IWeightGoal>(
  {
    targetWeight: {
      type: Number,
      required: [true, "Target weight is required"],
      min: [1, "Target weight must be positive"],
    },
    startWeight: {
      type: Number,
      required: [true, "Start weight is required"],
      min: [1, "Start weight must be positive"],
    },
    targetDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Active", "Achieved", "Abandoned"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  },
);

const WeightGoal: Model<IWeightGoal> =
  mongoose.models.WeightGoal ||
  mongoose.model<IWeightGoal>("WeightGoal", WeightGoalSchema);

export default WeightGoal;
