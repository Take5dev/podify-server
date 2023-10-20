import {
  getFavorites,
  getIsFavorite,
  toggleFavorite,
} from "@/controllers/favorite";
import { isUserAuthorized, isVerified } from "@/middleware/auth";
import { Router } from "express";

const router = Router();

router.post("/", isUserAuthorized, isVerified, toggleFavorite);
router.get("/", isUserAuthorized, isVerified, getFavorites);
router.get("/is-fav", isUserAuthorized, isVerified, getIsFavorite);

export default router;
