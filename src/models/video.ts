import mongoose, { Schema, Document, Model } from "mongoose";

export interface IChecklistItem {
  label: string;
  done: boolean;
}

export interface IVideo extends Document {
  title: string;
  hook: string;
  notes: string;
  status:
    | "Idea"
    | "Scripting"
    | "Recording"
    | "Editing"
    | "Scheduled"
    | "Published";
  priority: "Low" | "Medium" | "High";
  pillar: string;
  playlistIds: string[];
  tags: string[];
  targetDate: Date | null;
  videoUrl: string;
  checklist: IChecklistItem[];
  createdAt: Date;
  updatedAt: Date;
}

const ChecklistItemSchema = new Schema<IChecklistItem>(
  {
    label: { type: String, required: true, trim: true },
    done: { type: Boolean, default: false },
  },
  { _id: false },
);

const VideoSchema = new Schema<IVideo>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    hook: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: [
        "Idea",
        "Scripting",
        "Recording",
        "Editing",
        "Scheduled",
        "Published",
      ],
      default: "Idea",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    pillar: {
      type: String,
      trim: true,
      default: "",
    },
    playlistIds: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    targetDate: {
      type: Date,
      default: null,
    },
    videoUrl: {
      type: String,
      trim: true,
      default: "",
    },
    checklist: {
      type: [ChecklistItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const Video: Model<IVideo> =
  mongoose.models.Video || mongoose.model<IVideo>("Video", VideoSchema);

export default Video;
