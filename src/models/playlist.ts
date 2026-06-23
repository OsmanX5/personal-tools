import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPlaylist extends Document {
  name: string;
  description: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

const PlaylistSchema = new Schema<IPlaylist>(
  {
    name: {
      type: String,
      required: [true, "Playlist name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    color: {
      type: String,
      default: "blue",
    },
  },
  {
    timestamps: true,
  },
);

const Playlist: Model<IPlaylist> =
  mongoose.models.Playlist ||
  mongoose.model<IPlaylist>("Playlist", PlaylistSchema);

export default Playlist;
