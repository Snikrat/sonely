import { Router } from "express";
import {
  createPlaylist,
  generateDescription,
  generatePlaylist,
} from "../controllers/playlist.controller";
import { ensureAuth } from "../middlewares/auth";

const router = Router();

router.post("/playlist/generate", ensureAuth, generatePlaylist);
router.post("/playlist/description", ensureAuth, generateDescription);
router.post("/playlist/create", ensureAuth, createPlaylist);

export default router;
