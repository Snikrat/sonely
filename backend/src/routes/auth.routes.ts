import { Router } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import {
  buildAuthorizeUrl,
  exchangeCodeForToken,
  getSpotifyProfile,
  getTopArtists,
  getTopTracks,
} from "../services/spotifyAuth.service";

const router = Router();

router.get("/auth/spotify/login-url", (_req, res) => {
  const state = jwt.sign(
    { purpose: "spotify-oauth-state" },
    process.env.JWT_SECRET as string,
    { expiresIn: "10m" },
  );

  return res.json({ url: buildAuthorizeUrl(state), state });
});

router.post("/auth/spotify/callback", async (req, res) => {
  try {
    const { code, state } = req.body;

    if (!code || typeof code !== "string" || !state || typeof state !== "string") {
      return res.status(400).json({ error: "code e state são obrigatórios" });
    }

    jwt.verify(state, process.env.JWT_SECRET as string);

    const tokenData = await exchangeCodeForToken(code);
    const profile = await getSpotifyProfile(tokenData.access_token);
    const topArtists = await getTopArtists(tokenData.access_token);
    const topTracks = await getTopTracks(tokenData.access_token);

    const user = await prisma.user.upsert({
      where: { spotifyId: profile.id },
      update: {
        email: profile.email,
        displayName: profile.display_name,
        spotifyAccessToken: tokenData.access_token,
        spotifyRefreshToken: tokenData.refresh_token,
        spotifyTokenExpiresAt: new Date(
          Date.now() + tokenData.expires_in * 1000,
        ),
        topArtists: JSON.stringify(topArtists),
        topTracks: JSON.stringify(topTracks),
      },
      create: {
        spotifyId: profile.id,
        email: profile.email,
        displayName: profile.display_name,
        spotifyAccessToken: tokenData.access_token,
        spotifyRefreshToken: tokenData.refresh_token,
        spotifyTokenExpiresAt: new Date(
          Date.now() + tokenData.expires_in * 1000,
        ),
        topArtists: JSON.stringify(topArtists),
        topTracks: JSON.stringify(topTracks),
      },
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string, {
      expiresIn: "7d",
    });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    });
  } catch (error: any) {
    console.error(
      "Erro no callback do Spotify:",
      error?.response?.data || error,
    );

    return res.status(401).json({ error: "Falha na autenticação com Spotify" });
  }
});

export default router;
