import { PaginationRequest } from "@/@types/misc";
import Audio, { AudioDocument } from "@/models/audio";
import AutoPlaylist from "@/models/autoPlaylist";
import History from "@/models/history";
import Playlist from "@/models/playlist";
import User, { UserDocument } from "@/models/user";
import { getUserFavoriteCategories } from "@/utils/helpers";
import { RequestHandler } from "express";
import { PipelineStage, Types, isValidObjectId } from "mongoose";

export const updateFollower: RequestHandler = async (req, res) => {
  const { userId } = req.params;
  let status: "added" | "removed";

  if (!isValidObjectId(userId))
    return res.status(422).json({ error: "Invalid User Id" });

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const isFollowing = await User.findOne({
    _id: userId,
    followers: req.user._id,
  });

  if (isFollowing) {
    await User.findByIdAndUpdate(userId, {
      $pull: { followers: req.user._id },
    });
    status = "removed";
  } else {
    await User.findByIdAndUpdate(userId, {
      $addToSet: { followers: req.user._id },
    });
    status = "added";
  }

  if (status === "added") {
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { followings: userId },
    });
  } else {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { followings: userId },
    });
  }

  res.json({ status });
};

export const getAudios: RequestHandler = async (req, res) => {
  const { page = "1", limit = "20" } = req.query as PaginationRequest;

  const audios = await Audio.find({
    owner: req.user._id,
  })
    .skip((+page - 1) * +limit)
    .limit(+limit)
    .sort("-createdAt");

  const formattedAudios = audios.map((audio) => {
    return {
      id: audio._id,
      title: audio.title,
      about: audio.about,
      category: audio.category,
      file: audio.file.url,
      poster: audio.poster?.url,
      date: audio.createdAt,
      owner: {
        name: req.user.name,
        id: req.user._id,
      },
    };
  });

  res.json({ audios: formattedAudios });
};

export const getPublicAudios: RequestHandler = async (req, res) => {
  const { userId } = req.params;
  const { page = "1", limit = "20" } = req.query as PaginationRequest;

  if (!isValidObjectId(userId))
    return res.status(422).json({ error: "Invalid User Id" });

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const audios = await Audio.find({
    owner: userId,
  })
    .skip((+page - 1) * +limit)
    .limit(+limit)
    .sort("-createdAt")
    .populate<AudioDocument<UserDocument>>("owner");

  const formattedAudios = audios.map((audio) => {
    return {
      id: audio._id,
      title: audio.title,
      category: audio.category,
      file: audio.file.url,
      poster: audio.poster?.url,
      date: audio.createdAt,
      owner: {
        name: audio.owner.name,
        id: audio.owner._id,
      },
    };
  });

  res.json({ audios: formattedAudios });
};

export const getPublicProfile: RequestHandler = async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId))
    return res.status(422).json({ error: "Invalid User Id" });

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  res.json({
    user: {
      id: user._id,
      name: user.name,
      followers: user.followers.length,
      avatar: user.avatar?.url,
    },
  });
};

export const getPublicPlaylists: RequestHandler = async (req, res) => {
  const { userId } = req.params;
  const { page = "1", limit = "20" } = req.query as PaginationRequest;

  if (!isValidObjectId(userId))
    return res.status(422).json({ error: "Invalid User Id" });

  const playlists = await Playlist.find({
    owner: userId,
    visibility: "public",
  })
    .skip((+page - 1) * +limit)
    .limit(+limit)
    .sort("-createdAt")
    .populate<{ items: AudioDocument<UserDocument>[] }>({
      path: "items",
      select: "id title category file.url poster.url",
      populate: {
        path: "owner",
        select: "name id",
      },
    });

  if (!playlists) return res.json({ playlists: [] });

  res.json({
    playlists: playlists.map((item) => {
      return {
        id: item._id,
        title: item.title,
        count: item.items.length,
        visibility: item.visibility,
      };
    }),
  });
};

export const getRecommendedByProfile: RequestHandler = async (req, res) => {
  const user = req.user;

  let matchOption: PipelineStage.Match = {
    $match: { _id: { $exists: true } },
  };

  if (user) {
    const userFavoriteCategories = await getUserFavoriteCategories(user._id);

    if (userFavoriteCategories.length > 0) {
      matchOption = {
        $match: { category: { $in: userFavoriteCategories } },
      };
    }
  }

  const genericAudios = await Audio.aggregate([
    matchOption,
    {
      $sort: { "likes.count": -1 },
    },
    { $limit: 10 },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerInfo",
      },
    },
    { $unwind: "$ownerInfo" },
    {
      $project: {
        id: "$_id",
        title: "$title",
        about: "$about",
        file: "$file.url",
        poster: "$poster.url",
        category: "$category",

        owner: {
          name: "$ownerInfo.name",
          id: "$ownerInfo._id",
        },
      },
    },
  ]);

  res.json({ audios: genericAudios });
};

export const getAutoPlaylists: RequestHandler = async (req, res) => {
  const mixTitle = "Mix 20";

  const [mostListenedAudios] = await History.aggregate([
    { $match: { owner: req.user._id } },
    { $unwind: "$all" },
    { $group: { _id: "$all.audio", items: { $addToSet: "$all.audio" } } },
    { $sample: { size: 20 } },
    { $group: { _id: null, items: { $push: "$_id" } } },
  ]);

  if (mostListenedAudios && mostListenedAudios.items.length > 0) {
    await Playlist.updateOne(
      { owner: req.user._id, title: mixTitle },
      {
        $set: {
          title: mixTitle,
          items: mostListenedAudios.items,
          visibility: "auto",
        },
      },
      { upsert: true }
    );
  }

  const userFavoriteCategories = await getUserFavoriteCategories(req.user._id);

  let matchOption: PipelineStage.Match = {
    $match: { _id: { $exists: true } },
  };

  if (userFavoriteCategories.length > 0) {
    if (userFavoriteCategories.length > 0) {
      matchOption = {
        $match: { title: { $in: userFavoriteCategories } },
      };
    }
  }

  const autoPlaylists = await AutoPlaylist.aggregate([
    matchOption,
    { $sample: { size: 4 } },
    {
      $project: {
        _id: 0,
        id: "$_id",
        title: "$title",
        count: { $size: "$items" },
      },
    },
  ]);

  const mixPlaylist = await Playlist.findOne({
    owner: req.user._id,
    title: mixTitle,
  });

  const finalPlaylists = autoPlaylists.concat({
    id: mixPlaylist?._id,
    title: mixPlaylist?.title,
    count: mixPlaylist?.items.length,
  });

  res.json({ playlists: finalPlaylists });
};

export const getUserFollowers: RequestHandler = async (req, res) => {
  const { page = "1", limit = "20" } = req.query as PaginationRequest;

  const [followers] = await User.aggregate([
    { $match: { _id: req.user._id } },
    {
      $project: {
        followers: { $slice: ["$followers", (+page - 1) * +limit, +limit] },
      },
    },
    { $unwind: "$followers" },
    {
      $lookup: {
        from: "users",
        localField: "followers",
        foreignField: "_id",
        as: "followerInfo",
      },
    },
    { $unwind: "$followerInfo" },
    {
      $group: {
        _id: null,
        followers: {
          $push: {
            id: "$followerInfo._id",
            name: "$followerInfo.name",
            avatar: "$followerInfo.avatar.url",
          },
        },
      },
    },
  ]);

  if (!followers) {
    return res.json({ followers: [] });
  }

  res.json({ followers: followers.followers });
};

export const getUserFollowings: RequestHandler = async (req, res) => {
  const { page = "1", limit = "20" } = req.query as PaginationRequest;

  const [followings] = await User.aggregate([
    { $match: { _id: req.user._id } },
    {
      $project: {
        followings: { $slice: ["$followings", (+page - 1) * +limit, +limit] },
      },
    },
    { $unwind: "$followings" },
    {
      $lookup: {
        from: "users",
        localField: "followings",
        foreignField: "_id",
        as: "followerInfo",
      },
    },
    { $unwind: "$followerInfo" },
    {
      $group: {
        _id: null,
        followings: {
          $push: {
            id: "$followerInfo._id",
            name: "$followerInfo.name",
            avatar: "$followerInfo.avatar.url",
          },
        },
      },
    },
  ]);

  if (!followings) {
    return res.json({ followings: [] });
  }

  res.json({ followings: followings.followings });
};

export const getProfileFollowers: RequestHandler = async (req, res) => {
  const { page = "1", limit = "20" } = req.query as PaginationRequest;
  const { userId } = req.params;

  if (!isValidObjectId(userId))
    return res.status(422).json({ error: "Invalid User Id" });

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const [followers] = await User.aggregate([
    { $match: { _id: user._id } },
    {
      $project: {
        followers: { $slice: ["$followers", (+page - 1) * +limit, +limit] },
      },
    },
    { $unwind: "$followers" },
    {
      $lookup: {
        from: "users",
        localField: "followers",
        foreignField: "_id",
        as: "followerInfo",
      },
    },
    { $unwind: "$followerInfo" },
    {
      $group: {
        _id: null,
        followers: {
          $push: {
            id: "$followerInfo._id",
            name: "$followerInfo.name",
            avatar: "$followerInfo.avatar.url",
          },
        },
      },
    },
  ]);

  if (!followers) {
    return res.json({ followers: [] });
  }

  res.json({ followers: followers.followers });
};

export const getPlaylistAudios: RequestHandler = async (req, res) => {
  const { playlistId } = req.params;
  const { page = "1", limit = "20" } = req.query as PaginationRequest;

  if (!isValidObjectId(playlistId))
    return res.status(422).json({ error: "Invalid Playlist Id" });

  const aggregationLogic = [
    {
      $match: {
        _id: new Types.ObjectId(playlistId),
        visibilty: { $ne: "private" },
      },
    },
    {
      $project: {
        items: {
          $slice: ["$items", (+page - 1) * +limit, +limit],
        },
        title: "$title",
      },
    },
    { $unwind: "$items" },
    {
      $lookup: {
        from: "audios",
        localField: "items",
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
      $group: {
        _id: {
          id: "$_id",
          title: "$title",
        },
        audios: {
          $push: {
            id: "$audioInfo._id",
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
      },
    },
    {
      $project: {
        _id: 0,
        id: "$_id.id",
        title: "$_id.title",
        audios: "$$ROOT.audios",
      },
    },
  ];

  const [playlistAudios] = await Playlist.aggregate(aggregationLogic);

  if (!playlistAudios) {
    const [autoAudios] = await AutoPlaylist.aggregate(aggregationLogic);
    return autoAudios
      ? res.json({ playlist: autoAudios })
      : res.json({ playlist: [] });
  }

  res.json({ playlist: playlistAudios });
};

export const getPrivatePlaylistAudios: RequestHandler = async (req, res) => {
  const { playlistId } = req.params;
  const { page = "1", limit = "20" } = req.query as PaginationRequest;

  if (!isValidObjectId(playlistId))
    return res.status(422).json({ error: "Invalid Playlist Id" });

  const aggregationLogic = [
    {
      $match: {
        _id: new Types.ObjectId(playlistId),
        owner: req.user._id,
      },
    },
    {
      $project: {
        items: {
          $slice: ["$items", (+page - 1) * +limit, +limit],
        },
        title: "$title",
      },
    },
    { $unwind: "$items" },
    {
      $lookup: {
        from: "audios",
        localField: "items",
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
      $group: {
        _id: {
          id: "$_id",
          title: "$title",
        },
        audios: {
          $push: {
            id: "$audioInfo._id",
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
      },
    },
    {
      $project: {
        _id: 0,
        id: "$_id.id",
        title: "$_id.title",
        audios: "$$ROOT.audios",
      },
    },
  ];

  const [playlistAudios] = await Playlist.aggregate(aggregationLogic);

  if (!playlistAudios) {
    const [autoAudios] = await AutoPlaylist.aggregate(aggregationLogic);
    return autoAudios
      ? res.json({ playlist: autoAudios })
      : res.json({ playlist: [] });
  }

  res.json({ playlist: playlistAudios });
};

export const getIsFollowing: RequestHandler = async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId))
    return res.status(422).json({ error: "Invalid User Id" });

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const isFollowing = await User.findOne({
    _id: userId,
    followers: req.user._id,
  });

  res.json({ isFollowing: isFollowing ? true : false });
};
