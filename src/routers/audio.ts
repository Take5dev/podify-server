import {
  createAudio,
  getLatestUploads,
  updateAudio,
} from "@/controllers/audio";
import { isUserAuthorized, isVerified } from "@/middleware/auth";
import { parseFiles } from "@/middleware/fileParser";
import { validate } from "@/middleware/validator";
import { CreateAudioSchema } from "@/utils/validationSchema";
import { Router } from "express";

const router = Router();

router.post(
  "/",
  isUserAuthorized,
  isVerified,
  parseFiles,
  validate(CreateAudioSchema),
  createAudio
);

router.patch(
  "/:audioId",
  isUserAuthorized,
  isVerified,
  parseFiles,
  validate(CreateAudioSchema),
  updateAudio
);

router.get("/latest", getLatestUploads);

export default router;
