import { UserDocument } from "@/models/user";
import { Request } from "express";
import { Types } from "mongoose";

export interface UserProfile {
  _id: Types.ObjectId;
  name: string;
  email: string;
  verified: boolean;
  avatar?: string;
  followers: number;
  followings: number;
}

declare global {
  namespace Express {
    interface Request {
      user: UserProfile;
      token: string;
    }
  }
}

export interface CreateUser extends Request {
  body: {
    name: string;
    email: string;
    password: string;
  };
}

export interface VerifyTokenAndUserIdRequest extends Request {
  body: {
    _id: string;
    token: string;
  };
}

export interface ResendVerificationTokenRequest extends Request {
  body: {
    _id: string;
  };
}

export interface ForgotPasswordRequest extends Request {
  body: {
    email: string;
  };
}

export interface UpdatePasswordRequest extends Request {
  body: {
    _id: string;
    password: string;
  };
}

export interface LoginRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}
