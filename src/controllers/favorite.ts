import { PaginationRequest } from "@/@types/misc";
import Audio from "@/models/audio";
import Favorite from "@/models/favorite";
import { RequestHandler } from "express";
import { isValidObjectId } from "mongoose";

export const toggleFavorite: RequestHandler = async (req, res) => {
  const { id } = req.query;
  let status: "added" | "removed";

  if (!isValidObjectId(id))
    return res.status(422).json({ error: "Invalid Audio ID" });

  const audio = await Audio.findById(id);
  if (!audio) return res.status(404).json({ error: "Audio not found" });

  const isInList = await Favorite.findOne({
    owner: req.user._id,
    items: id,
  });

  if (isInList) {
    const listId = isInList._id;
    const toggledList = await Favorite.findByIdAndUpdate(listId, {
      $pull: { items: id },
    });
    status = "removed";
  } else {
    const favorite = await Favorite.findOne({ owner: req.user._id });
    if (favorite) {
      const favId = favorite._id;
      const updatedList = await Favorite.findByIdAndUpdate(favId, {
        $addToSet: { items: id },
      });
    } else {
      const newList = await Favorite.create({
        owner: req.user._id,
        items: [audio],
      });
    }
    status = "added";
  }

  if (status === "added") {
    await Audio.findByIdAndUpdate(id, {
      $addToSet: { likes: req.user._id },
    });
  } else {
    await Audio.findByIdAndUpdate(id, {
      $pull: { likes: req.user._id },
    });
  }

  res.json({ status: status === "added" ? true : false });
};

export const getFavorites: RequestHandler = async (req, res) => {
  const { page = "1", limit = "20" } = req.query as PaginationRequest;

  const favorites = await Favorite.aggregate([
    { $match: { owner: req.user._id } },
    {
      $project: {
        audioIds: {
          $slice: ["$items", (+page - 1) * +limit, +limit],
        },
      },
    },
    { $unwind: "$audioIds" },
    {
      $lookup: {
        from: "audios",
        localField: "audioIds",
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
        id: "$audioInfo._id",
        title: "$audioInfo.title",
        about: "$audioInfo.about",
        category: "$audioInfo.category",
        file: "$audioInfo.file.url",
        poster: "$audioInfo.poster.url",
        owner: {
          name: "$ownerInfo.name",
          id: "$ownerInfo._id",
        },
      },
    },
  ]);

  res.json({ audios: favorites });
};

export const getIsFavorite: RequestHandler = async (req, res) => {
  const audioId = req.query.id as string;

  if (!isValidObjectId(audioId))
    return res.status(422).json({ error: "Invalid Audio ID" });

  const favorite = await Favorite.findOne({
    owner: req.user._id,
    items: audioId,
  });

  res.json({ result: favorite ? true : false });
};
