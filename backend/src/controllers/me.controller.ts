import { Response } from "express";
import { prisma } from "../lib/prisma";
import {
  ensureValidAccessToken,
  getFollowedArtists,
  getLikedSongs,
  getRecentlyPlayed,
  getTopArtistsDetailed,
  getTopTracks,
  getTopTracksDetailed,
  getUserPlaylists,
  type TopItemsTimeRange,
} from "../services/spotifyAuth.service";
import { dedupeConsecutiveTracks } from "../utils/dedupe";
import { computeInsights } from "../utils/insights";
import { computeLikeDayOfWeek } from "../utils/likeStats";
import { computeListeningClock } from "../utils/listeningClock";

const VALID_TIME_RANGES: TopItemsTimeRange[] = [
  "short_term",
  "medium_term",
  "long_term",
];

export async function topTracks(req: any, res: Response) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const timeRange = VALID_TIME_RANGES.includes(req.query.time_range)
      ? (req.query.time_range as TopItemsTimeRange)
      : "medium_term";

    const accessToken = await ensureValidAccessToken(user);
    const tracks = await getTopTracks(accessToken, timeRange);

    return res.json({ tracks });
  } catch (error: any) {
    console.error(
      "Erro ao buscar músicas mais ouvidas:",
      error?.response?.data || error,
    );

    return res.status(500).json({ error: "Erro ao buscar músicas mais ouvidas" });
  }
}

async function getAuthedUserOrFail(userId: string, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    res.status(404).json({ error: "Usuário não encontrado" });
    return null;
  }

  return user;
}

export async function recentlyPlayed(req: any, res: Response) {
  try {
    const user = await getAuthedUserOrFail(req.userId, res);
    if (!user) return;

    const accessToken = await ensureValidAccessToken(user);
    const tracks = await getRecentlyPlayed(accessToken, 50);
    const clock = computeListeningClock(tracks);

    return res.json({ tracks: dedupeConsecutiveTracks(tracks), clock });
  } catch (error: any) {
    console.error(
      "Erro ao buscar músicas ouvidas recentemente:",
      error?.response?.data || error,
    );

    return res
      .status(500)
      .json({ error: "Erro ao buscar músicas ouvidas recentemente" });
  }
}

export async function library(req: any, res: Response) {
  try {
    const user = await getAuthedUserOrFail(req.userId, res);
    if (!user) return;

    const accessToken = await ensureValidAccessToken(user);

    const [likedSongs, followedArtists, playlists] = await Promise.all([
      getLikedSongs(accessToken, 50),
      getFollowedArtists(accessToken, 50),
      getUserPlaylists(accessToken, 20),
    ]);

    const { peakDay } = computeLikeDayOfWeek(likedSongs.items);

    return res.json({
      likedSongsCount: likedSongs.total,
      likedSongs: likedSongs.items,
      likePeakDay: peakDay,
      followedArtistsCount: followedArtists.total,
      followedArtists: followedArtists.items,
      followedArtistsNextCursor: followedArtists.nextCursor,
      playlists,
    });
  } catch (error: any) {
    console.error(
      "Erro ao buscar biblioteca do usuário:",
      error?.response?.data || error,
    );

    return res.status(500).json({ error: "Erro ao buscar biblioteca do usuário" });
  }
}

export async function likedSongsPage(req: any, res: Response) {
  try {
    const user = await getAuthedUserOrFail(req.userId, res);
    if (!user) return;

    const accessToken = await ensureValidAccessToken(user);
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

    const { total, items } = await getLikedSongs(accessToken, 50, offset);

    return res.json({ items, total });
  } catch (error: any) {
    console.error(
      "Erro ao buscar mais músicas curtidas:",
      error?.response?.data || error,
    );

    return res
      .status(500)
      .json({ error: "Erro ao buscar mais músicas curtidas" });
  }
}

export async function followedArtistsPage(req: any, res: Response) {
  try {
    const user = await getAuthedUserOrFail(req.userId, res);
    if (!user) return;

    const accessToken = await ensureValidAccessToken(user);
    const after =
      typeof req.query.after === "string" ? req.query.after : undefined;

    const { total, items, nextCursor } = await getFollowedArtists(
      accessToken,
      50,
      after,
    );

    return res.json({ items, total, nextCursor });
  } catch (error: any) {
    console.error(
      "Erro ao buscar mais artistas seguidos:",
      error?.response?.data || error,
    );

    return res
      .status(500)
      .json({ error: "Erro ao buscar mais artistas seguidos" });
  }
}

export async function insights(req: any, res: Response) {
  try {
    const user = await getAuthedUserOrFail(req.userId, res);
    if (!user) return;

    const accessToken = await ensureValidAccessToken(user);

    const [detailedTracks, artistsShort, artistsMedium, artistsLong] =
      await Promise.all([
        getTopTracksDetailed(accessToken, "long_term", 50),
        getTopArtistsDetailed(accessToken, "short_term"),
        getTopArtistsDetailed(accessToken, "medium_term"),
        getTopArtistsDetailed(accessToken, "long_term"),
      ]);

    const data = computeInsights(
      detailedTracks,
      artistsShort,
      artistsMedium,
      artistsLong,
    );

    return res.json(data);
  } catch (error: any) {
    console.error(
      "Erro ao calcular estatísticas do usuário:",
      error?.response?.data || error,
    );

    return res
      .status(500)
      .json({ error: "Erro ao calcular estatísticas do usuário" });
  }
}
