import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQuickLink extends Document {
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuickLinkSchema = new Schema<IQuickLink>(
  {
    url: {
      type: String,
      required: [true, "URL is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const QuickLink: Model<IQuickLink> =
  mongoose.models.QuickLink ||
  mongoose.model<IQuickLink>("QuickLink", QuickLinkSchema);

export default QuickLink;
