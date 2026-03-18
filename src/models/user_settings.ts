import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserSettings extends Document {
  height: number | null; // cm
  createdAt: Date;
  updatedAt: Date;
}

const UserSettingsSchema = new Schema<IUserSettings>(
  {
    height: {
      type: Number,
      default: null,
      min: [1, "Height must be positive"],
    },
  },
  {
    timestamps: true,
  },
);

const UserSettings: Model<IUserSettings> =
  mongoose.models.UserSettings ||
  mongoose.model<IUserSettings>("UserSettings", UserSettingsSchema);

export default UserSettings;
