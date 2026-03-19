import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICourse extends Document {
  title: string;
  platform:
    | "Udemy"
    | "Coursera"
    | "YouTube"
    | "Book"
    | "DataCamp"
    | "Udacity"
    | "Other";
  type: "Course" | "Book" | "Tutorial";
  url: string;
  status: "Wishlist" | "In Progress" | "Paused" | "Completed" | "Dropped";
  priority: "Low" | "Medium" | "High";
  totalLessons: number;
  completedLessons: number;
  tags: string[];
  startDate: Date | null;
  completionDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    title: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
    },
    platform: {
      type: String,
      enum: [
        "Udemy",
        "Coursera",
        "YouTube",
        "Book",
        "DataCamp",
        "Udacity",
        "Other",
      ],
      required: [true, "Platform is required"],
    },
    type: {
      type: String,
      enum: ["Course", "Book", "Tutorial"],
      required: [true, "Course type is required"],
    },
    url: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["Wishlist", "In Progress", "Paused", "Completed", "Dropped"],
      default: "Wishlist",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    totalLessons: {
      type: Number,
      min: 0,
      default: 0,
    },
    completedLessons: {
      type: Number,
      min: 0,
      default: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
    startDate: {
      type: Date,
      default: null,
    },
    completionDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const Course: Model<ICourse> =
  mongoose.models.Course || mongoose.model<ICourse>("Course", CourseSchema);

export default Course;
