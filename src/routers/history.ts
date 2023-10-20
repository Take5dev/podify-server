import {
  deleteHistory,
  getHistories,
  getRecent,
  updateHistory,
} from "@/controllers/history";
import { isUserAuthorized, isVerified } from "@/middleware/auth";
import { validate } from "@/middleware/validator";
import { UpdateHistorySchema } from "@/utils/validationSchema";
import { Router } from "express";

const router = Router();

router.post(
  "/",
  isUserAuthorized,
  isVerified,
  validate(UpdateHistorySchema),
  updateHistory
);
router.delete("/", isUserAuthorized, isVerified, deleteHistory);
router.get("/", isUserAuthorized, isVerified, getHistories);
router.get("/recent", isUserAuthorized, isVerified, getRecent);

export default router;
