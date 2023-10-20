import * as yup from "yup";
import { isValidObjectId } from "mongoose";
import { categories } from "./audio_category";

export const CreateUserSchema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .required("Name is required")
    .min(3, "Minimum Name length is 3 characters")
    .max(256, "Name is too long"),
  email: yup
    .string()
    .email("Your email is not valid")
    .required("Email is required"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Minimum Password length is 8 characters")
    .max(256, "Password is too long")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/,
      "Password Must Contain al teast 8 Characters, One Uppercase, One Lowercase, One Number and One Special Case Character"
    ),
});

export const TokenAndUserIdValidationSchema = yup.object().shape({
  token: yup.string().trim().required("Token is required"),
  _id: yup
    .string()
    .transform(function (value) {
      return this.isType(value) && isValidObjectId(value) ? value : "";
    })
    .required("User ID is required"),
});

export const ResendVerificationBodySchema = yup.object().shape({
  _id: yup
    .string()
    .transform(function (value) {
      return this.isType(value) && isValidObjectId(value) ? value : "";
    })
    .required("User ID is required"),
});

export const ResetPasswordBodySchema = yup.object().shape({
  email: yup
    .string()
    .email("Your email is not valid")
    .required("Email is required"),
});

export const UpdatePasswordBodySchema = yup.object().shape({
  token: yup.string().trim().required("Token is required"),
  _id: yup
    .string()
    .transform(function (value) {
      return this.isType(value) && isValidObjectId(value) ? value : "";
    })
    .required("User ID is required"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Minimum Password length is 8 characters")
    .max(256, "Password is too long")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/,
      "Password Must Contain al teast 8 Characters, One Uppercase, One Lowercase, One Number and One Special Case Character"
    ),
});

export const LoginBodySchema = yup.object().shape({
  email: yup
    .string()
    .email("Your email is not valid")
    .required("Email is required"),
  password: yup.string().required("Password is required"),
});

export const CreateAudioSchema = yup.object().shape({
  title: yup
    .string()
    .trim()
    .required("Title is required")
    .min(3, "Minimum Title length is 3 characters")
    .max(256, "Title is too long"),
  about: yup.string(),
  category: yup.string().oneOf(categories, "Invalid category"),
});

export const CreatePlaylistSchema = yup.object().shape({
  title: yup
    .string()
    .trim()
    .required("Title is required")
    .min(3, "Minimum Title length is 3 characters")
    .max(256, "Title is too long"),
  audioId: yup.string().transform(function (value) {
    return this.isType(value) && isValidObjectId(value) ? value : "";
  }),
  visibility: yup
    .string()
    .oneOf(["public", "private"], "Visibility must be public or private"),
});

export const DeletePlaylistSchema = yup.object().shape({
  audioId: yup.string().transform(function (value) {
    return this.isType(value) && isValidObjectId(value) ? value : "";
  }),
  all: yup.string().oneOf(["yes", "no"], "All must be yes or no"),
});

export const UpdateHistorySchema = yup.object().shape({
  audioId: yup
    .string()
    .transform(function (value) {
      return this.isType(value) && isValidObjectId(value) ? value : "";
    })
    .required("Audio ID is required"),
  progress: yup.number().required("Progress is required"),
  date: yup.string().transform(function (value) {
    const date = new Date(value);
    date instanceof Date ? value : Date.now();
  }),
});
