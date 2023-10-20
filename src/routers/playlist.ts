import {
  createPlaylist,
  deletePlaylist,
  getPlaylist,
  getPlaylistsByProfile,
  updatePlaylist,
} from "@/controllers/playlist";
import { isUserAuthorized, isVerified } from "@/middleware/auth";
import { validate } from "@/middleware/validator";
import {
  CreatePlaylistSchema,
  DeletePlaylistSchema,
} from "@/utils/validationSchema";
import { Router } from "express";

const router = Router();

router.post(
  "/",
  isUserAuthorized,
  isVerified,
  validate(CreatePlaylistSchema),
  createPlaylist
);

router.patch(
  "/:playlistId",
  isUserAuthorized,
  isVerified,
  validate(CreatePlaylistSchema),
  updatePlaylist
);

router.delete(
  "/:playlistId",
  isUserAuthorized,
  isVerified,
  validate(DeletePlaylistSchema),
  deletePlaylist
);

router.get("/profile", isUserAuthorized, isVerified, getPlaylistsByProfile);
router.get("/:playlistId", isUserAuthorized, isVerified, getPlaylist);

export default router;
