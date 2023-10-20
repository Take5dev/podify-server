import { Model, ObjectId, Schema, model, models } from "mongoose";

interface AutoPlaylistDocument {
  title: string;
  items: ObjectId[];
}

const autoPlaylistSchema = new Schema<AutoPlaylistDocument>(
  {
    title: {
      type: String,
      required: true,
    },
    items: [
      {
        type: Schema.Types.ObjectId,
        ref: "Audio",
        required: true,
      },
    ],
  },
  { timestamps: true }
);

const AutoPlaylist =
  models.AutoPlaylist || model("AutoPlaylist", autoPlaylistSchema);

export default AutoPlaylist as Model<AutoPlaylistDocument>;
