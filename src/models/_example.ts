/**
 * Example Mongoose Model
 * ----------------------
 * Copy this file and rename it to create a new model for your tool.
 *
 * Steps:
 * 1. Copy this file: cp _example.ts my-model.ts
 * 2. Rename the interface, schema, and model name
 * 3. Adjust the fields to match your data
 * 4. Import and use in your API routes
 *
 * See the Mongoose docs for field types:
 * https://mongoosejs.com/docs/schematypes.html
 */

import mongoose, { Schema, Document, Model } from "mongoose";

// 1. Define a TypeScript interface for your document
export interface IExample extends Document {
  title: string;
  description?: string;
  status: "active" | "archived";
  amount?: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// 2. Define the Mongoose schema
const ExampleSchema = new Schema<IExample>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },
    amount: {
      type: Number,
      min: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true,
  },
);

// 3. Export the model (with protection against re-compilation in dev)
const Example: Model<IExample> =
  mongoose.models.Example || mongoose.model<IExample>("Example", ExampleSchema);

export default Example;
