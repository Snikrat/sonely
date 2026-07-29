import { Request, Response } from "express";
import {
  generatePlaylistDescription,
  generatePlaylistTrackSuggestions,
} from "../services/openai.service";
import { searchTrack } from "../services/spotify.service";
import {
  addTracksToPlaylist,
  createPlaylist as createSpotifyPlaylist,
  ensureValidAccessToken,
} from "../services/spotifyAuth.service";
import { prisma } from "../lib/prisma";

const PLAYLIST_SIZE = 20;
const DEFAULT_NAME = "SONELY PLAYLIST";

type TrackRef = { name: string; artist: string };

function isTrackRef(value: any): value is TrackRef {
  return (
    value &&
    typeof value.name === "string" &&
    typeof value.artist === "string"
  );
}

function trackKey(track: TrackRef) {
  return `${track.name}|${track.artist}`.toLowerCase();
}

export async function generatePlaylist(req: any, res: Response) {
  try {
    const { prompt, keep, exclude } = req.body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "Descrição inválida.", tracks: [] });
    }

    const keptTracks: TrackRef[] = Array.isArray(keep)
      ? keep.filter(isTrackRef)
      : [];
    const excludedTracks: TrackRef[] = Array.isArray(exclude)
      ? exclude.filter(isTrackRef)
      : [];

    const needed = PLAYLIST_SIZE - keptTracks.length;

    if (needed <= 0) {
      return res.json({ tracks: keptTracks.slice(0, PLAYLIST_SIZE) });
    }

    const seenKeys = new Set([
      ...keptTracks.map(trackKey),
      ...excludedTracks.map(trackKey),
    ]);

    const suggestions = await generatePlaylistTrackSuggestions({
      prompt,
      count: Math.ceil(needed * 1.5),
      keep: keptTracks,
      exclude: excludedTracks,
    });

    const resolved: TrackRef[] = [];

    for (const suggestion of suggestions) {
      if (resolved.length >= needed) break;
      if (!suggestion?.title || !suggestion?.artist) continue;

      const track = await searchTrack(suggestion.title, suggestion.artist);
      if (!track) continue;

      const key = trackKey(track);
      if (seenKeys.has(key)) continue;

      seenKeys.add(key);
      resolved.push(track as any);
    }

    return res.json({ tracks: [...keptTracks, ...resolved] });
  } catch (error: any) {
    console.error(
      "🔥 ERRO ao gerar playlist:",
      error?.response?.data || error,
    );

    return res.status(500).json({
      error: "Erro ao gerar sugestões de playlist.",
      tracks: [],
    });
  }
}

export async function generateDescription(req: any, res: Response) {
  try {
    const { prompt, tracks } = req.body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "Descrição inválida." });
    }

    if (!Array.isArray(tracks) || tracks.length === 0) {
      return res.status(400).json({ error: "Lista de músicas inválida." });
    }

    const description = await generatePlaylistDescription({
      prompt,
      tracks: tracks.filter(isTrackRef),
    });

    return res.json({ description });
  } catch (error: any) {
    console.error(
      "🔥 ERRO ao gerar descrição da playlist:",
      error?.response?.data || error,
    );

    return res.status(500).json({ error: "Erro ao gerar descrição da playlist." });
  }
}

export async function createPlaylist(req: any, res: Response) {
  try {
    const { name, tracks, prompt, description: providedDescription } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Descrição inválida." });
    }

    if (!Array.isArray(tracks) || tracks.length === 0 || tracks.length > 50) {
      return res.status(400).json({ error: "Lista de músicas inválida." });
    }

    const uris = tracks
      .filter((t: any) => t && typeof t.uri === "string" && t.uri)
      .map((t: any) => t.uri);

    if (uris.length === 0) {
      return res.status(400).json({ error: "Nenhuma música válida para criar a playlist." });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const accessToken = await ensureValidAccessToken(user);
    const playlistName =
      typeof name === "string" && name.trim() ? name.trim() : DEFAULT_NAME;

    const description =
      typeof providedDescription === "string" && providedDescription.trim()
        ? providedDescription.trim().slice(0, 300)
        : await generatePlaylistDescription({
            prompt,
            tracks: tracks.filter(isTrackRef),
          });

    const playlist = await createSpotifyPlaylist(
      accessToken,
      playlistName,
      description,
      false,
    );

    await addTracksToPlaylist(accessToken, playlist.id, uris);

    return res.json({
      url: playlist.url,
      name: playlistName,
      description,
    });
  } catch (error: any) {
    console.error(
      "🔥 ERRO ao criar playlist:",
      error?.response?.data || error,
    );

    if (error?.response?.status === 403) {
      return res.status(403).json({
        error:
          "Sua conexão com o Spotify não tem permissão para criar playlists. Reconecte sua conta para autorizar.",
        code: "insufficient_scope",
      });
    }

    return res.status(500).json({ error: "Erro ao criar playlist." });
  }
}
