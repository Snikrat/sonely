import { Router } from "express";
import {
  feedbackStats,
  moodJournal,
  recommend,
  submitFeedback,
} from "../controllers/recommendation.controller";
import { ensureAuth } from "../middlewares/auth";

const router = Router();

router.post("/recommend", ensureAuth, recommend);
router.post("/recommend/feedback", ensureAuth, submitFeedback);
router.get("/recommend/feedback/stats", ensureAuth, feedbackStats);
router.get("/mood-journal", ensureAuth, moodJournal);

export default router;
