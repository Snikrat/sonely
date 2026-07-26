import { Request, Response } from "express";
import { analyzeEmotion } from "../services/openai.service";
import { searchSpotify } from "../services/spotify.service";
import { computeFeedbackStats } from "../utils/feedbackStats";
import { computeHistoryStats } from "../utils/historyStats";
import { computeMoodStats } from "../utils/moodStats";
import { rankTracks } from "../utils/ranking";
import { buildUserProfile } from "../utils/userProfile";
import { prisma } from "../lib/prisma";

export async function recommend(req: any, res: Response) {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        message: "Mensagem inválida.",
        playlists: [],
        tracks: [],
      });
    }

    const emotion = await analyzeEmotion(message);

    await prisma.history.create({
      data: {
        message,
        emotion,
        userId: req.userId,
      },
    });

    const history = await prisma.history.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const profile = buildUserProfile(history);

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    const topArtists: string[] = user?.topArtists
      ? JSON.parse(user.topArtists)
      : [];
    const topTracks: { name: string; artist: string }[] = user?.topTracks
      ? JSON.parse(user.topTracks)
      : [];

    const feedbackRows = await prisma.trackFeedback.findMany({
      where: { userId: req.userId },
    });

    const feedbackMap: Record<string, number> = {};
    feedbackRows.forEach((f) => {
      feedbackMap[`${f.trackName}|${f.artistName}`.toLowerCase()] = f.rating;
    });

    const perfilGeneros = profile.generos.slice(0, 8);

    const ENERGIA_QUERY_TERMS: Record<string, string> = {
      baixa: "calma acústico",
      media: "",
      alta: "energético animado",
    };

    const rawQuery = `
      ${perfilGeneros.join(" ")}
      ${emotion.generos_sugeridos.join(" ")}
      ${emotion.vibes.join(" ")}
      ${topArtists.slice(0, 3).join(" ")}
      ${ENERGIA_QUERY_TERMS[emotion.energia_atual] ?? ""}
      ${emotion.objetivo}
    `;

    // A Spotify rejeita buscas com mais de 250 caracteres.
    const query = rawQuery.replace(/\s+/g, " ").trim().slice(0, 250);

    const spotifyData = await searchSpotify(query);

    const rawTracks = spotifyData?.tracks?.items ?? [];
    const rawPlaylists = spotifyData?.playlists?.items ?? [];

    const tracks = rawTracks
      .filter((t: any) => t && t.name && t.external_urls?.spotify)
      .map((t: any) => ({
        name: t.name,
        artist: t.artists?.[0]?.name || "Desconhecido",
        url: t.external_urls.spotify,
        image: t.album?.images?.[0]?.url || "",
      }));

    const playlists = rawPlaylists
      .filter((p: any) => p && p.name && p.external_urls?.spotify)
      .map((p: any) => ({
        name: p.name,
        url: p.external_urls.spotify,
        image: p.images?.[0]?.url || "",
      }));

    const rankedTracks = rankTracks(
      tracks,
      emotion.generos_sugeridos,
      emotion.vibes,
      emotion.evitar,
      perfilGeneros,
      topArtists,
      topTracks,
      feedbackMap,
    );

    const publicTracks = rankedTracks
      .slice(0, 5)
      .map(({ score, ...track }) => track);

    return res.json({
      message: `Entendi que você está se sentindo ${emotion.sentimento_atual} e quer ${emotion.objetivo}.`,
      emotion,
      profile: { ...profile, topArtistsSpotify: topArtists },
      tracks: publicTracks,
      playlists: playlists.slice(0, 5),
    });
  } catch (error: any) {
    console.error("🔥 ERRO:", error?.response?.data || error);

    return res.status(500).json({
      message: "Erro ao gerar recomendação.",
      playlists: [],
      tracks: [],
    });
  }
}

export async function moodJournal(req: any, res: Response) {
  try {
    const history = await prisma.history.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
    });

    const entries = history.slice(0, 50).map((h) => ({
      id: h.id,
      message: h.message,
      emotion: h.emotion as any,
      createdAt: h.createdAt,
    }));

    const stats = computeMoodStats(history as any);
    const historyStats = computeHistoryStats(history as any);

    return res.json({ entries, stats, historyStats });
  } catch (error: any) {
    console.error("Erro ao buscar diário de humor:", error?.response?.data || error);

    return res.status(500).json({ error: "Erro ao buscar diário de humor" });
  }
}

export async function submitFeedback(req: any, res: Response) {
  try {
    const { trackName, artistName, rating } = req.body;

    if (
      !trackName ||
      typeof trackName !== "string" ||
      !artistName ||
      typeof artistName !== "string" ||
      (rating !== 1 && rating !== -1 && rating !== 0)
    ) {
      return res.status(400).json({ error: "Dados de feedback inválidos" });
    }

    if (rating === 0) {
      await prisma.trackFeedback.deleteMany({
        where: { userId: req.userId, trackName, artistName },
      });

      return res.json({ feedback: 0 });
    }

    await prisma.trackFeedback.upsert({
      where: {
        userId_trackName_artistName: {
          userId: req.userId,
          trackName,
          artistName,
        },
      },
      update: { rating },
      create: { userId: req.userId, trackName, artistName, rating },
    });

    return res.json({ feedback: rating });
  } catch (error: any) {
    console.error("Erro ao salvar feedback:", error?.response?.data || error);

    return res.status(500).json({ error: "Erro ao salvar feedback" });
  }
}

export async function feedbackStats(req: any, res: Response) {
  try {
    const rows = await prisma.trackFeedback.findMany({
      where: { userId: req.userId },
      select: { rating: true },
    });

    return res.json(computeFeedbackStats(rows));
  } catch (error: any) {
    console.error(
      "Erro ao calcular taxa de acerto do feedback:",
      error?.response?.data || error,
    );

    return res
      .status(500)
      .json({ error: "Erro ao calcular taxa de acerto do feedback" });
  }
}
