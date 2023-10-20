import { DeleteHistory, UpdateHistory } from "@/@types/history";
import { PaginationRequest } from "@/@types/misc";
import Audio from "@/models/audio";
import History, { HistoryType } from "@/models/history";
import { RequestHandler } from "express";

export const updateHistory: RequestHandler = async (
  req: UpdateHistory,
  res
) => {
  const { audioId, progress, date } = req.body;
  const existingHistory = await History.findOne({
    owner: req.user._id,
  });

  const inputDate = date ? date : new Date();

  const audio = await Audio.findById(audioId);
  if (!audio) return res.status(404).json({ error: "Audio not found" });

  const history: HistoryType = {
    audio: audio._id,
    progress,
    date: inputDate,
  };

  if (!existingHistory) {
    const createdHistory = await History.create({
      owner: req.user._id,
      last: history,
      all: [history],
    });
    return res.status(201).json({ history: createdHistory });
  }

  const today = new Date();
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const endOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1
  );

  const histories = await History.aggregate([
    {
      $match: { owner: req.user._id },
    },
    { $unwind: "$all" },
    { $match: { "all.date": { $gte: startOfDay, $lt: endOfDay } } },
    {
      $project: {
        _id: 0,
        audio: "$all.audio",
      },
    },
  ]);

  const sameDayHistory = histories.find(
    (item) => item.audio.toString() === audioId
  );

  let updatedHistory: Object | null = {};
  if (sameDayHistory) {
    updatedHistory = await History.findOneAndUpdate(
      {
        owner: req.user._id,
        "all.audio": audio._id,
      },
      {
        $set: {
          "all.$.progress": progress,
          "all.$.date": inputDate,
        },
      },
      { new: true }
    );

    updatedHistory = await History.findOneAndUpdate(
      {
        owner: req.user._id,
        "last.audio": audio._id,
      },
      {
        $set: { last: history },
      },
      { new: true }
    );
  } else {
    updatedHistory = await History.findByIdAndUpdate(existingHistory._id, {
      $push: { all: { $each: [history], $position: 0 } },
      $set: { last: history },
    });
  }

  res.json({ history: updatedHistory });
};

export const deleteHistory: RequestHandler = async (
  req: DeleteHistory,
  res
) => {
  const { all } = req.query;
  const removeAll = all === "yes";

  if (removeAll) {
    await History.findOneAndDelete({
      owner: req.user._id,
    });

    return res.json({ message: "Entire History deleted" });
  }

  const audioIds = req.query.audioIds as string;
  if (audioIds && audioIds.length > 0) {
    const audiosJson = JSON.parse(audioIds) as string[];

    const updatedHistory = await History.findOneAndUpdate(
      {
        owner: req.user._id,
      },
      { $pull: { all: { _id: audiosJson } } },
      { new: true }
    );

    return res.json({ history: updatedHistory });
  }

  return res.json({ message: "Empty Request" });
};

export const getHistories: RequestHandler = async (req, res) => {
  const { page = "1", limit = "20" } = req.query as PaginationRequest;
  const histories = await History.aggregate([
    { $match: { owner: req.user._id } },
    { $project: { all: { $slice: ["$all", (+page - 1) * +limit, +limit] } } },
    { $unwind: "$all" },
    {
      $lookup: {
        from: "audios",
        localField: "all.audio",
        foreignField: "_id",
        as: "audioInfo",
      },
    },
    { $unwind: "$audioInfo" },
    {
      $project: {
        _id: 0,
        id: "$all._id",
        audioId: "$audioInfo._id",
        date: "$all.date",
        title: "$audioInfo.title",
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        audios: { $push: "$$ROOT" },
      },
    },
    {
      $project: {
        _id: 0,
        id: "$id",
        date: "$_id",
        audios: "$$ROOT.audios",
      },
    },
    { $sort: { date: -1 } },
  ]);

  return res.json({ histories });
};

export const getRecent: RequestHandler = async (req, res) => {
  const { page = "1", limit = "20" } = req.query as PaginationRequest;
  const recents = await History.aggregate([
    { $match: { owner: req.user._id } },
    {
      $project: {
        myHistory: {
          $slice: ["$all", (+page - 1) * +limit, +limit],
        },
      },
    },
    {
      $project: {
        histories: {
          $sortArray: {
            input: "$myHistory",
            sortBy: { date: -1 },
          },
        },
      },
    },
    {
      $unwind: {
        path: "$histories",
        includeArrayIndex: "index",
      },
    },
    {
      $lookup: {
        from: "audios",
        localField: "histories.audio",
        foreignField: "_id",
        as: "audioInfo",
      },
    },
    { $unwind: "$audioInfo" },
    {
      $lookup: {
        from: "users",
        localField: "audioInfo.owner",
        foreignField: "_id",
        as: "ownerInfo",
      },
    },
    { $unwind: "$ownerInfo" },
    {
      $project: {
        _id: 0,
        id: "$histories._id",
        date: "$histories.date",
        process: "$histories.progress",

        audioId: "$audioInfo._id",
        title: "$audioInfo.title",
        about: "$audioInfo.about",
        file: "$audioInfo.file.url",
        poster: "$audioInfo.poster.url",
        category: "$audioInfo.category",

        owner: {
          name: "$ownerInfo.name",
          id: "$ownerInfo._id",
        },
      },
    },
  ]);

  res.json({ recents: recents });
};
