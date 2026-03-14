import mongoose, { Schema, Document, Model } from "mongoose";

export interface IJob extends Document {
  company: string;
  position: string;
  country: string;
  workStyle: "Remote" | "On-site" | "Hybrid";
  expectedSalary: number | null;
  fitPercentage: number;
  level: "Junior" | "Mid" | "Senior" | "Lead";
  status: "Interested" | "Applied" | "In-Process" | "Rejected" | "Offered";
  applicationMethod:
    | "Company Website"
    | "LinkedIn"
    | "Indeed"
    | "Glassdoor"
    | "Referral"
    | "Other";
  resumeId: string;
  applicationLink: string;
  companyLink: string;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    position: {
      type: String,
      required: [true, "Position is required"],
      trim: true,
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },
    workStyle: {
      type: String,
      enum: ["Remote", "On-site", "Hybrid"],
      required: [true, "Work style is required"],
    },
    expectedSalary: {
      type: Number,
      default: null,
    },
    fitPercentage: {
      type: Number,
      min: 1,
      max: 10,
      required: [true, "Fit percentage is required"],
    },
    level: {
      type: String,
      enum: ["Junior", "Mid", "Senior", "Lead"],
      required: [true, "Job level is required"],
    },
    status: {
      type: String,
      enum: ["Interested", "Applied", "In-Process", "Rejected", "Offered"],
      default: "Interested",
    },
    applicationMethod: {
      type: String,
      enum: [
        "Company Website",
        "LinkedIn",
        "Indeed",
        "Glassdoor",
        "Referral",
        "Other",
      ],
      required: [true, "Application method is required"],
    },
    resumeId: {
      type: String,
      trim: true,
      default: "",
    },
    applicationLink: {
      type: String,
      trim: true,
      default: "",
    },
    companyLink: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

const Job: Model<IJob> =
  mongoose.models.Job || mongoose.model<IJob>("Job", JobSchema);

export default Job;
