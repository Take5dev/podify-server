import {
  create,
  generateForgotPasswordLink,
  grantValid,
  logOut,
  sendProfile,
  sendVerificationToken,
  signIn,
  updatePassword,
  updateProfile,
  verifyEmail,
} from "@/controllers/auth";
import { isUserAuthorized, verifyPasswordResetToken } from "@/middleware/auth";
import { parseFiles } from "@/middleware/fileParser";
import { validate } from "@/middleware/validator";
import {
  CreateUserSchema,
  TokenAndUserIdValidationSchema,
  ResendVerificationBodySchema,
  ResetPasswordBodySchema,
  UpdatePasswordBodySchema,
  LoginBodySchema,
} from "@/utils/validationSchema";
import { Router } from "express";

const router = Router();

router.post("/signup", validate(CreateUserSchema), create);
router.post("/verify", validate(TokenAndUserIdValidationSchema), verifyEmail);
router.post(
  "/reverify",
  validate(ResendVerificationBodySchema),
  sendVerificationToken
);
router.post(
  "/forgot",
  validate(ResetPasswordBodySchema),
  generateForgotPasswordLink
);
router.post(
  "/verifyToken",
  validate(TokenAndUserIdValidationSchema),
  verifyPasswordResetToken,
  grantValid
);
router.post(
  "/password",
  validate(UpdatePasswordBodySchema),
  verifyPasswordResetToken,
  updatePassword
);
router.post("/login", validate(LoginBodySchema), signIn);
router.get("/is-auth", isUserAuthorized, sendProfile);

router.post("/profile", isUserAuthorized, parseFiles, updateProfile);
router.post("/logout", isUserAuthorized, logOut);

export default router;
