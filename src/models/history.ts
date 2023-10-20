import { Model, ObjectId, Types, Schema, model, models } from "mongoose";

export type HistoryType = {
  audio: Types.ObjectId;
  progress: number;
  date: Date;
};

export interface HistoryDocument {
  owner: ObjectId;
  last: HistoryType;
  all: HistoryType[];
}

const historySchema = new Schema<HistoryDocument>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    last: {
      audio: {
        type: Schema.Types.ObjectId,
        ref: "Audio",
        required: true,
      },
      progress: Number,
      date: Date,
    },
    all: [
      {
        audio: {
          type: Schema.Types.ObjectId,
          ref: "Audio",
          required: true,
        },
        progress: {
          type: Number,
          required: true,
        },
        date: {
          type: Date,
          required: true,
          default: Date.now(),
        },
      },
    ],
  },
  { timestamps: true }
);

const History = models.History || model("History", historySchema);

export default History as Model<HistoryDocument>;
