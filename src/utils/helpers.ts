import History from "@/models/history";
import { UserDocument } from "@/models/user";
import moment from "moment";
import mongoose from "mongoose";

export const generateOTPToken = (length = 6): string => {
  let otp: string = "";
  for (let i = 0; i < length; i++) {
    const digit: number = Math.floor(Math.random() * 10);
    otp += digit;
  }
  return otp;
};

export const formatProfile = (user: UserDocument) => {
  const { _id, name, email, verified, avatar, followers, followings } = user;
  return {
    _id,
    name,
    email,
    verified,
    avatar: avatar?.url,
    followers: followers.length,
    followings: followings.length,
  };
};

export const getUserFavoriteCategories = async (
  userId: mongoose.Types.ObjectId
): Promise<string[]> => {
  const [result] = await History.aggregate([
    { $match: { owner: userId } },
    { $unwind: "$all" },
    {
      $match: {
        "all.date": { $gte: moment().subtract(30, "days").toDate() },
      },
    },
    { $group: { _id: "$all.audio" } },
    {
      $lookup: {
        from: "audios",
        localField: "_id",
        foreignField: "_id",
        as: "audioInfo",
      },
    },
    { $unwind: "$audioInfo" },
    { $group: { _id: null, category: { $addToSet: "$audioInfo.category" } } },
  ]);

  if (result) return result.category;

  return [];
};
