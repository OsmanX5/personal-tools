import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEmergencyFundConfig extends Document {
  targetType: string;
  targetMonths: number;
  fixedTargetAmount?: number;
  fixedTargetCurrency: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmergencyFundConfigSchema = new Schema<IEmergencyFundConfig>(
  {
    targetType: {
      type: String,
      enum: ["months", "fixed", "both"],
      default: "months",
    },
    targetMonths: {
      type: Number,
      min: 1,
      default: 6,
    },
    fixedTargetAmount: {
      type: Number,
      min: 0,
    },
    fixedTargetCurrency: {
      type: String,
      enum: ["USD", "SAR", "EUR"],
      default: "USD",
    },
  },
  { timestamps: true },
);

const EmergencyFundConfig: Model<IEmergencyFundConfig> =
  mongoose.models.EmergencyFundConfig ||
  mongoose.model<IEmergencyFundConfig>(
    "EmergencyFundConfig",
    EmergencyFundConfigSchema,
  );

export default EmergencyFundConfig;
