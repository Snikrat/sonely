import { Router } from "express";
import { ensureAuth } from "../middlewares/auth";
import {
  followedArtistsPage,
  insights,
  library,
  likedSongsPage,
  recentlyPlayed,
  topTracks,
} from "../controllers/me.controller";

const router = Router();

router.get("/me/top-tracks", ensureAuth, topTracks);
router.get("/me/recently-played", ensureAuth, recentlyPlayed);
router.get("/me/library", ensureAuth, library);
router.get("/me/library/liked-songs", ensureAuth, likedSongsPage);
router.get("/me/library/followed-artists", ensureAuth, followedArtistsPage);
router.get("/me/insights", ensureAuth, insights);

export default router;
