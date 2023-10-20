import {
  getAudios,
  getAutoPlaylists,
  getIsFollowing,
  getPlaylistAudios,
  getPrivatePlaylistAudios,
  getProfileFollowers,
  getPublicAudios,
  getPublicPlaylists,
  getPublicProfile,
  getRecommendedByProfile,
  getUserFollowers,
  getUserFollowings,
  updateFollower,
} from "@/controllers/profile";
import { checkAuth, isUserAuthorized, isVerified } from "@/middleware/auth";
import { Router } from "express";

const router = Router();

router.post("/follower/:userId", isUserAuthorized, updateFollower);
router.get("/following/:userId", isUserAuthorized, isVerified, getIsFollowing);
router.get("/audios", isUserAuthorized, isVerified, getAudios);
router.get("/audios/:userId", getPublicAudios);
router.get("/playlist/:userId", getPublicPlaylists);
router.get("/playlistAudios/:playlistId", getPlaylistAudios);
router.get(
  "/privatePlaylistAudios/:playlistId",
  isUserAuthorized,
  isVerified,
  getPrivatePlaylistAudios
);
router.get("/recommended", checkAuth, getRecommendedByProfile);
router.get("/auto", isUserAuthorized, getAutoPlaylists);
router.get("/followers", isUserAuthorized, getUserFollowers);
router.get("/followers/:userId", isUserAuthorized, getProfileFollowers);
router.get("/followings", isUserAuthorized, getUserFollowings);
router.get("/:userId", getPublicProfile);

export default router;
