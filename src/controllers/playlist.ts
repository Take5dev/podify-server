import { PaginationRequest } from "@/@types/misc";
import { CreatePlaylist, DeletePlaylist } from "@/@types/playlist";
import Audio, { AudioDocument } from "@/models/audio";
import Playlist from "@/models/playlist";
import { UserDocument } from "@/models/user";
import { RequestHandler } from "express";
import { isValidObjectId } from "mongoose";

export const createPlaylist: RequestHandler = async (
  req: CreatePlaylist,
  res
) => {
  const { title, audioId, visibility } = req.body;
  const owner = req.user._id;

  const playlist = await Playlist.create({
    owner,
    title,
    visibility,
  });

  if (audioId) {
    const audio = await Audio.findById(audioId);
    if (!audio) return res.status(404).json({ error: "Audio not found" });

    playlist.items = [audio.id];
    playlist.save();
  }

  res.status(201).json({ playlist });
};

export const updatePlaylist: RequestHandler = async (
  req: CreatePlaylist,
  res
) => {
  const { playlistId } = req.params;
  const { title, audioId, visibility } = req.body;

  let playlist = await Playlist.findOneAndUpdate(
    {
      _id: playlistId,
      owner: req.user._id,
    },
    {
      title,
      visibility,
    },
    { new: true }
  );

  if (!playlist) return res.status(404).json({ error: "Playlist not found" });

  if (audioId) {
    const audio = await Audio.findById(audioId);
    if (!audio) return res.status(404).json({ error: "Audio not found" });

    playlist = await Playlist.findByIdAndUpdate(
      playlist.id,
      {
        $addToSet: { items: audio.id },
      },
      { new: true }
    );
  }

  res.json({ playlist });
};

export const deletePlaylist: RequestHandler = async (
  req: DeletePlaylist,
  res
) => {
  const { audioId, all } = req.body;
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId))
    return res.status(422).json({ error: "Invalid Playlist Id" });

  if (all === "yes") {
    const playlist = await Playlist.findOneAndDelete({
      _id: playlistId,
      owner: req.user._id,
    });

    if (!playlist) return res.status(404).json({ error: "Playlist not found" });

    return res.json({ message: "Playlist deleted" });
  } else {
    if (audioId) {
      if (!isValidObjectId(audioId))
        return res.status(422).json({ error: "Invalid Audio Id" });

      const audio = await Audio.findById(audioId);
      if (!audio) return res.status(404).json({ error: "Audio not found" });

      const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
          $pull: { items: audio.id },
        },
        { new: true }
      );

      if (!playlist)
        return res.status(404).json({ error: "Playlist not found" });

      return res.json({ playlist });
    }
  }

  res.json({ message: "Empty Request" });
};

export const getPlaylistsByProfile: RequestHandler = async (req, res) => {
  const { page = "1", limit = "20" } = req.query as PaginationRequest;

  const playlists = await Playlist.find({
    owner: req.user._id,
    visibility: { $ne: "auto" },
  })
    .skip((+page - 1) * +limit)
    .limit(+limit)
    .sort("-createdAt");

  const formattedPlaylists = playlists.map((playlist) => {
    return {
      id: playlist._id,
      title: playlist.title,
      visiblity: playlist.visibility,
      count: playlist.items.length,
    };
  });

  res.json({ playlists: formattedPlaylists });
};

export const getPlaylist: RequestHandler = async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId))
    return res.status(422).json({ error: "Invalid Playlist Id" });

  const playlist = await Playlist.findOne({
    _id: playlistId,
    owner: req.user._id,
  }).populate<{ items: AudioDocument<UserDocument>[] }>({
    path: "items",
    select: "id title category file.url poster.url",
    populate: {
      path: "owner",
      select: "name id",
    },
  });
  if (!playlist) return res.json({ playlist: {} });

  // const formattedPlaylist = playlist.items.map((item) => {
  //   return {
  //     id: item._id,
  //     title: item.title,
  //     category: item.category,
  //     file: item.file.url,
  //     poster: item.poster?.url,
  //     owner: {
  //       name: item.owner.name,
  //       id: item.owner._id,
  //     },
  //   };
  // });

  res.json({ playlist });
};
