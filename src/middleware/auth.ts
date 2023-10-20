import { VerifyTokenAndUserIdRequest } from "@/@types/user";
import PasswordResetToken from "@/models/passwordResetToken";
import User from "@/models/user";
import { JWT_SECRET } from "@/utils/variables";
import { RequestHandler } from "express";
import { JwtPayload, verify } from "jsonwebtoken";

export const verifyPasswordResetToken: RequestHandler = async (
  req: VerifyTokenAndUserIdRequest,
  res,
  next
) => {
  const { token, _id } = req.body;

  const resetToken = await PasswordResetToken.findOne({ owner: _id });
  if (!resetToken) return res.status(498).json({ error: "Invalid Token" });

  const matched = await resetToken.compareToken(token);
  if (!matched) return res.status(498).json({ error: "Invalid Token" });

  next();
};

export const isUserAuthorized: RequestHandler = async (req, res, next) => {
  const { authorization } = req.headers;
  const token = authorization?.split("Bearer ")[1];

  if (!token) return res.status(403).json({ error: "Restricted Access" });

  const { _id } = verify(token, JWT_SECRET) as JwtPayload;

  const user = await User.findOne({ _id: _id, tokens: token });
  if (!user) return res.status(403).json({ error: "Restricted Access" });

  req.user = {
    _id: user._id,
    name: user.name,
    email: user.email,
    verified: user.verified,
    avatar: user.avatar?.url,
    followers: user.followers?.length,
    followings: user.followings?.length,
  };

  req.token = token;

  next();
};

export const isVerified: RequestHandler = async (req, res, next) => {
  if (!req.user.verified)
    return res.status(403).json({ error: "Please verify your email" });
  next();
};

export const checkAuth: RequestHandler = async (req, res, next) => {
  const { authorization } = req.headers;
  const token = authorization?.split("Bearer ")[1];

  if (token) {
    const { _id } = verify(token, JWT_SECRET) as JwtPayload;

    const user = await User.findOne({ _id: _id, tokens: token });
    if (!user) return res.status(403).json({ error: "Restricted Access" });

    req.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      verified: user.verified,
      avatar: user.avatar?.url,
      followers: user.followers?.length,
      followings: user.followings?.length,
    };

    req.token = token;
  }

  next();
};
