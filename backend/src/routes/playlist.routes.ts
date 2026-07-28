import { Router } from "express";
import {
  createPlaylist,
  generatePlaylist,
} from "../controllers/playlist.controller";
import { ensureAuth } from "../middlewares/auth";

const router = Router();

router.post("/playlist/generate", ensureAuth, generatePlaylist);
router.post("/playlist/create", ensureAuth, createPlaylist);

export default router;
