import {
  CreateUser,
  ForgotPasswordRequest,
  LoginRequest,
  ResendVerificationTokenRequest,
  UpdatePasswordRequest,
  VerifyTokenAndUserIdRequest,
} from "@/@types/user";
import EmailVerificationToken from "@/models/emailVerificationToken";
import PasswordResetToken from "@/models/passwordResetToken";
import User from "@/models/user";
import { formatProfile, generateOTPToken } from "@/utils/helpers";
import {
  sendForgotPasswordMail,
  sendUpdatedPasswordMail,
  sendVerificationMail,
} from "@/utils/mail";
import { RequestHandler } from "express";
import crypto from "crypto";
import { JWT_SECRET, PASSWORD_RESET_LINK } from "@/utils/variables";
import jwt from "jsonwebtoken";
import { RequestWithFiles } from "@/middleware/fileParser";
import cloudinary from "@/cloud";

export const create: RequestHandler = async (req: CreateUser, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({
    email,
  });
  if (existingUser)
    return res.status(403).json({ error: "User already exists" });

  const user = await User.create({ name, email, password });

  const token = generateOTPToken();
  await EmailVerificationToken.create({
    owner: user._id,
    token,
  });
  sendVerificationMail(token, {
    _id: user._id.toString(),
    name,
    email,
  });

  res.status(201).json({ user: { _id: user._id, name, email } });
};

export const verifyEmail: RequestHandler = async (
  req: VerifyTokenAndUserIdRequest,
  res
) => {
  const { token, _id } = req.body;

  const verificationToken = await EmailVerificationToken.findOne({
    owner: _id,
  });

  if (!verificationToken)
    return res.status(403).json({ error: "Invalid User" });

  const matched = await verificationToken.compareToken(token);
  if (!matched) return res.status(498).json({ error: "Invalid Token" });

  await User.findByIdAndUpdate(_id, {
    verified: true,
  });

  await EmailVerificationToken.findByIdAndDelete(verificationToken._id);

  res.json({ message: "Your Email was successfully confirmed" });
};

export const sendVerificationToken: RequestHandler = async (
  req: ResendVerificationTokenRequest,
  res
) => {
  const { _id } = req.body;

  // if (!isValidObjectId(_id))
  //   return res.status(403).json({ error: "User not found" });

  const user = await User.findById(_id);
  if (!user) return res.status(403).json({ error: "User not found" });

  await EmailVerificationToken.findOneAndDelete({
    owner: _id,
  });

  const token = generateOTPToken();
  await EmailVerificationToken.create({
    owner: _id,
    token,
  });

  const { name, email, verified } = user;
  if (verified) {
    return res.json({ message: "User is already verified" });
  }
  sendVerificationMail(token, {
    _id,
    name,
    email,
  });

  res.json({ message: "Your verification token was resent to your email" });
};

export const generateForgotPasswordLink: RequestHandler = async (
  req: ForgotPasswordRequest,
  res
) => {
  const { email } = req.body;

  const user = await User.findOne({
    email,
  });

  if (!user) return res.status(403).json({ error: "User not found" });

  await PasswordResetToken.findOneAndDelete({
    owner: user._id,
  });

  const token = crypto.randomBytes(36).toString("hex");
  await PasswordResetToken.create({
    owner: user._id,
    token,
  });

  const resetLink = `${PASSWORD_RESET_LINK}?token=${token}&user=${user._id}`;
  sendForgotPasswordMail({
    link: resetLink,
    email,
  });

  res.json({ message: "Your verification token was resent to your email" });
};

export const grantValid: RequestHandler = async (req, res) => {
  res.json({ valid: true });
};

export const updatePassword: RequestHandler = async (
  req: UpdatePasswordRequest,
  res
) => {
  const { password, _id } = req.body;

  const user = await User.findById(_id);
  if (!user) return res.status(403).json({ error: "User not found" });

  const matched = await user.comparePassword(password);
  if (matched)
    return res
      .status(422)
      .json({ error: "You cannot use the same password again" });

  user.password = password;
  await user.save();

  await PasswordResetToken.findOneAndDelete({
    owner: _id,
  });

  sendUpdatedPasswordMail(user.name, user.email);

  res.json({ message: "You password was updated" });
};

export const signIn: RequestHandler = async (req: LoginRequest, res) => {
  const { password, email } = req.body;

  const user = await User.findOne({
    email,
  });
  if (!user) return res.status(403).json({ error: "Login error" });

  const matched = await user.comparePassword(password);
  if (!matched)
    return res.status(403).json({ error: "Email / password mismatch" });

  const token = jwt.sign({ _id: user._id }, JWT_SECRET);
  user.tokens.push(token);

  await user.save();

  res.json({
    user: formatProfile(user),
    token,
  });
};

export const updateProfile: RequestHandler = async (
  req: RequestWithFiles,
  res
) => {
  const { name } = req.body;
  const avatar = req.files?.avatar;

  const user = await User.findById(req.user._id);
  if (!user) throw new Error("Something went wrong: User not found");

  if (typeof name !== "string")
    return res.status(422).json({ error: "Name must be a string" });

  if (name.length > 0) {
    if (name.trim().length < 3)
      return res
        .status(422)
        .json({ error: "Name must be at least 3 characters" });

    user.name = name;
  }

  if (avatar) {
    if (user.avatar?.publicId) {
      await cloudinary.uploader.destroy(user.avatar.publicId);
    }

    const { secure_url: url, public_id: publicId } =
      await cloudinary.uploader.upload(avatar.filepath, {
        width: 300,
        height: 300,
        crop: "thumb",
        gravity: "face",
      });

    user.avatar = {
      url,
      publicId,
    };
  }

  await user.save();

  res.json({ profile: formatProfile(user) });
};

export const sendProfile: RequestHandler = async (req, res) => {
  res.json({
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      verified: req.user.verified,
      avatar: req.user.avatar,
      followers: req.user.followers,
      followings: req.user.followings,
    },
  });
};

export const logOut: RequestHandler = async (req, res) => {
  const { fromAll } = req.query;
  const token = req.token;

  const user = await User.findById(req.user._id);
  if (!user) throw new Error("Something went wrong: User not found");

  if (fromAll === "yes") {
    user.tokens = [];
  } else {
    user.tokens = user.tokens.filter((storedToken) => storedToken !== token);
  }

  await user.save();

  res.json({ message: "Logged Out successfully" });
};
