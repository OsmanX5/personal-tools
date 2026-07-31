import mongoose, { Schema, Document, Model } from "mongoose";
import { CurrencyType } from "@/models/networth_account";

export enum AssetCategory {
  Property = "Property",
  Vehicle = "Vehicle",
  PreciousMetal = "Precious Metal",
  Equipment = "Equipment",
  Collectible = "Collectible",
  Other = "Other",
}

export interface AssetValueEntry {
  date: Date;
  value: number;
  note?: string;
}

export interface IAsset extends Document {
  name: string;
  description?: string;
  status: "owned" | "sold";
  value: number;
  currency: CurrencyType;
  category: AssetCategory;
  acquisitionDate: Date;
  acquisitionCost: number;
  tags: string[];
  valueHistory: AssetValueEntry[];
  createdAt: Date;
  updatedAt: Date;
}

// A dated snapshot of what the asset was worth. Unlike an account transaction
// this records an absolute value, not a delta.
const AssetValueEntrySchema = new Schema<AssetValueEntry>(
  {
    date: {
      type: Date,
      default: Date.now,
    },
    value: {
      type: Number,
      required: [true, "Value is required"],
    },
    note: {
      type: String,
      trim: true,
    },
  },
  { _id: true },
);

const AssetSchema = new Schema<IAsset>(
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
    status: {
      type: String,
      enum: ["owned", "sold"],
      default: "owned",
    },
    value: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      enum: Object.values(CurrencyType),
      default: CurrencyType.USD,
    },
    category: {
      type: String,
      enum: Object.values(AssetCategory),
      required: true,
    },
    acquisitionDate: {
      type: Date,
      default: Date.now,
    },
    acquisitionCost: {
      type: Number,
      default: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
    valueHistory: {
      type: [AssetValueEntrySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Pin `value` to the most recent snapshot by date.
 *
 * Snapshots can be back-dated, so the newest entry in the array is not
 * necessarily the newest in time — the current value is whichever one is
 * latest on the calendar.
 */
export function syncAssetValue(asset: IAsset) {
  const latest = asset.valueHistory
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .at(-1);
  if (latest) asset.value = latest.value;
}

const Asset: Model<IAsset> =
  mongoose.models.Asset || mongoose.model<IAsset>("Asset", AssetSchema);

export default Asset;
