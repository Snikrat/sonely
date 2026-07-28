import axios from "axios";
import { prisma } from "../lib/prisma";

const AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";

const SCOPES = [
  "user-read-email",
  "user-read-private",
  "user-top-read",
  "user-read-recently-played",
  "user-library-read",
  "user-follow-read",
  "playlist-read-private",
  "playlist-modify-public",
  "playlist-modify-private",
].join(" ");

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

type SpotifyProfile = {
  id: string;
  email?: string;
  display_name?: string;
};

export type TopItemsTimeRange = "short_term" | "medium_term" | "long_term";

function basicAuthHeader() {
  return (
    "Basic " +
    Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
    ).toString("base64")
  );
}

export function buildAuthorizeUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID || "",
    response_type: "code",
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI || "",
    scope: SCOPES,
    state,
    // Força o Spotify a sempre mostrar a tela de permissão. Sem isso, quando
    // o usuário já tinha autorizado o app antes, o Spotify pode pular o
    // consentimento e devolver um token só com os escopos antigos, ignorando
    // os escopos novos que acabamos de adicionar (ex: playlist-modify-*).
    show_dialog: "true",
  });

  return `${AUTHORIZE_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string) {
  const response = await axios.post(
    TOKEN_URL,
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI || "",
    }),
    {
      headers: {
        Authorization: basicAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  return response.data as TokenResponse;
}

export async function getSpotifyProfile(accessToken: string) {
  const response = await axios.get("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return response.data as SpotifyProfile;
}

export async function refreshAccessToken(refreshToken: string) {
  const response = await axios.post(
    TOKEN_URL,
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    {
      headers: {
        Authorization: basicAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  return response.data as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
}

export async function getTopTracks(
  accessToken: string,
  timeRange: TopItemsTimeRange = "medium_term",
) {
  const response = await axios.get("https://api.spotify.com/v1/me/top/tracks", {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: { limit: 10, time_range: timeRange },
  });

  return (response.data.items ?? [])
    .filter((t: any) => t && t.name && t.external_urls?.spotify)
    .map((t: any) => ({
      name: t.name,
      artist: t.artists?.[0]?.name || "Desconhecido",
      url: t.external_urls.spotify,
      image: t.album?.images?.[0]?.url || "",
    }));
}

// A Spotify removeu o campo "genres" do objeto Artist para apps sem Extended
// Quota Mode (mudança de nov/2024), então usamos os nomes dos artistas mais
// ouvidos como sinal de personalização em vez de gêneros.
export async function getTopArtistsDetailed(
  accessToken: string,
  timeRange: TopItemsTimeRange = "medium_term",
): Promise<{ name: string; url: string }[]> {
  const response = await axios.get(
    "https://api.spotify.com/v1/me/top/artists",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { limit: 10, time_range: timeRange },
    },
  );

  return (response.data.items ?? [])
    .filter((artist: any) => artist?.name)
    .map((artist: any) => ({
      name: artist.name,
      url: artist.external_urls?.spotify || "",
    }));
}

export async function getTopArtists(
  accessToken: string,
  timeRange: TopItemsTimeRange = "medium_term",
) {
  const artists = await getTopArtistsDetailed(accessToken, timeRange);
  return artists.map((a) => a.name);
}

// Faixas com campos extras (explicit, data de lançamento, duração) usados só
// para calcular estatísticas — não usado na listagem simples de "mais
// ouvidas". Obs: o campo "popularity" não é retornado pra apps sem Extended
// Quota Mode (mesma restrição do "genres" em getTopArtists), por isso não dá
// pra montar um indicador de "mainstream vs indie" com esses dados.
export async function getTopTracksDetailed(
  accessToken: string,
  timeRange: TopItemsTimeRange = "medium_term",
  limit = 50,
) {
  const response = await axios.get("https://api.spotify.com/v1/me/top/tracks", {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: { limit, time_range: timeRange },
  });

  return (response.data.items ?? [])
    .filter((t: any) => t && t.name)
    .map((t: any) => ({
      name: t.name,
      artist: t.artists?.[0]?.name || "Desconhecido",
      album: t.album?.name || "",
      explicit: !!t.explicit,
      releaseDate: t.album?.release_date || "",
      durationMs: t.duration_ms ?? 0,
    }));
}

export async function getRecentlyPlayed(accessToken: string, limit = 20) {
  const response = await axios.get(
    "https://api.spotify.com/v1/me/player/recently-played",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { limit },
    },
  );

  return (response.data.items ?? [])
    .filter((item: any) => item?.track?.name && item.track.external_urls?.spotify)
    .map((item: any) => ({
      name: item.track.name,
      artist: item.track.artists?.[0]?.name || "Desconhecido",
      url: item.track.external_urls.spotify,
      image: item.track.album?.images?.[0]?.url || "",
      playedAt: item.played_at,
    }));
}

export async function getLikedSongs(
  accessToken: string,
  limit = 50,
  offset = 0,
) {
  const response = await axios.get("https://api.spotify.com/v1/me/tracks", {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: { limit, offset },
  });

  const items = (response.data.items ?? [])
    .filter(
      (item: any) => item?.track?.name && item.track.external_urls?.spotify,
    )
    .map((item: any) => ({
      name: item.track.name,
      artist: item.track.artists?.[0]?.name || "Desconhecido",
      url: item.track.external_urls.spotify,
      image: item.track.album?.images?.[0]?.url || "",
      addedAt: item.added_at || "",
    }));

  return { total: response.data.total ?? items.length, items };
}

// A Spotify pagina artistas seguidos com um cursor (query param "after" com o
// id do último artista da página anterior), diferente da paginação por
// offset usada no resto da API.
export async function getFollowedArtists(
  accessToken: string,
  limit = 50,
  after?: string,
) {
  const response = await axios.get("https://api.spotify.com/v1/me/following", {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: { type: "artist", limit, ...(after ? { after } : {}) },
  });

  const items = (response.data.artists?.items ?? [])
    .filter((artist: any) => artist?.name && artist.external_urls?.spotify)
    .map((artist: any) => ({
      name: artist.name,
      url: artist.external_urls.spotify,
      image: artist.images?.[0]?.url || "",
    }));

  return {
    total: response.data.artists?.total ?? items.length,
    items,
    nextCursor: response.data.artists?.cursors?.after ?? null,
  };
}

export async function ensureValidAccessToken(user: {
  id: string;
  spotifyAccessToken: string | null;
  spotifyRefreshToken: string;
  spotifyTokenExpiresAt: Date | null;
}) {
  const isExpired =
    !user.spotifyAccessToken ||
    !user.spotifyTokenExpiresAt ||
    user.spotifyTokenExpiresAt.getTime() <= Date.now();

  if (!isExpired) {
    return user.spotifyAccessToken as string;
  }

  const refreshed = await refreshAccessToken(user.spotifyRefreshToken);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      spotifyAccessToken: refreshed.access_token,
      spotifyTokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
      ...(refreshed.refresh_token
        ? { spotifyRefreshToken: refreshed.refresh_token }
        : {}),
    },
  });

  return refreshed.access_token;
}

export async function createPlaylist(
  accessToken: string,
  name: string,
  description: string,
  isPublic = false,
) {
  // A Spotify removeu o endpoint POST /users/{user_id}/playlists na
  // migração de fev/2026 (para apps em Development Mode). O substituto
  // oficial é POST /me/playlists, que já opera sobre o usuário do token.
  const response = await axios.post(
    "https://api.spotify.com/v1/me/playlists",
    { name, description, public: isPublic },
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  return {
    id: response.data.id as string,
    url: response.data.external_urls?.spotify as string,
  };
}

export async function addTracksToPlaylist(
  accessToken: string,
  playlistId: string,
  uris: string[],
) {
  // Endpoint renomeado de /tracks para /items na mesma migração de fev/2026.
  await axios.post(
    `https://api.spotify.com/v1/playlists/${playlistId}/items`,
    { uris },
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
}

export async function getUserPlaylists(accessToken: string, limit = 20) {
  const response = await axios.get("https://api.spotify.com/v1/me/playlists", {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: { limit },
  });

  return (response.data.items ?? [])
    .filter((p: any) => p && p.name && p.external_urls?.spotify)
    .map((p: any) => ({
      name: p.name,
      url: p.external_urls.spotify,
      image: p.images?.[0]?.url || "",
      tracksTotal: p.items?.total ?? p.tracks?.total ?? 0,
      owner: p.owner?.display_name || "",
    }));
}
