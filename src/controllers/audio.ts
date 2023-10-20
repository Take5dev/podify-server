import { CreateAudio } from "@/@types/audio";
import cloudinary from "@/cloud";
import { RequestHandler } from "express";
import formidable from "formidable";
import Audio, { AudioDocument } from "@/models/audio";
import { UserDocument } from "@/models/user";

export const createAudio: RequestHandler = async (req: CreateAudio, res) => {
  const { title, about, category } = req.body;
  const poster = req.files?.poster as formidable.File;
  const audioFile = req.files?.audio as formidable.File;
  const ownerId = req.user._id;

  if (!audioFile)
    return res.status(422).json({ error: "Audio Source File is required" });

  const audioFileResponse = await cloudinary.uploader.upload(
    audioFile.filepath,
    {
      resource_type: "video",
    }
  );

  const newAudio = new Audio({
    title,
    about,
    category,
    owner: ownerId,
    file: {
      url: audioFileResponse.secure_url,
      publicId: audioFileResponse.public_id,
    },
  });

  if (poster) {
    const posterResponse = await cloudinary.uploader.upload(poster.filepath, {
      width: 300,
      height: 300,
      crop: "thumb",
      gravity: "face",
    });

    newAudio.poster = {
      url: posterResponse.secure_url,
      publicId: posterResponse.public_id,
    };
  }

  const savedAudio = await newAudio.save();

  res.status(201).json({ audio: savedAudio });
};

export const updateAudio: RequestHandler = async (req: CreateAudio, res) => {
  const { title, about, category } = req.body;
  const poster = req.files?.poster as formidable.File;
  const ownerId = req.user._id;
  const { audioId } = req.params;

  const audio = await Audio.findOneAndUpdate(
    {
      _id: audioId,
      owner: req.user._id,
    },
    {
      title,
      about,
      category,
    },
    { new: true }
  );

  if (!audio)
    return res
      .status(403)
      .json({ error: "You don't have permission to update this Audio" });

  if (poster) {
    if (audio.poster?.publicId) {
      await cloudinary.uploader.destroy(audio.poster.publicId);
    }
    const posterResponse = await cloudinary.uploader.upload(poster.filepath, {
      width: 300,
      height: 300,
      crop: "thumb",
      gravity: "face",
    });

    audio.poster = {
      url: posterResponse.secure_url,
      publicId: posterResponse.public_id,
    };

    await audio.save();
  }

  res.json({ audio });
};

export const getLatestUploads: RequestHandler = async (req, res) => {
  const audios = await Audio.find()
    .sort("-cretedAt")
    .limit(10)
    .populate<AudioDocument<UserDocument>>("owner");

  const formattedAudios = audios.map((audio) => {
    return {
      id: audio._id,
      title: audio.title,
      about: audio.about,
      category: audio.category,
      file: audio.file.url,
      poster: audio.poster?.url,
      owner: {
        name: audio.owner.name,
        id: audio.owner._id,
      },
    };
  });

  res.json({ audios: formattedAudios });
};
