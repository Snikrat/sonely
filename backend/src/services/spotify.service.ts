import axios from "axios";

let accessToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiresAt) {
    return accessToken;
  }

  const response = await axios.post(
    "https://accounts.spotify.com/api/token",
    new URLSearchParams({
      grant_type: "client_credentials",
    }),
    {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
          ).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  accessToken = response.data.access_token;
  tokenExpiresAt = Date.now() + response.data.expires_in * 1000;

  return accessToken;
}

// A Spotify passou a rejeitar limit > 10 em buscas combinadas
// (type=track,playlist) pra apps sem Extended Quota Mode.
export async function searchSpotify(query: string, limit = 10) {
  const token = await getAccessToken();

  const response = await axios.get("https://api.spotify.com/v1/search", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      q: query,
      type: "track,playlist",
      limit,
    },
  });

  return response.data;
}

type ResolvedTrack = {
  name: string;
  artist: string;
  url: string;
  image: string;
  uri: string;
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .trim();
}

function toResolvedTrack(item: any): ResolvedTrack {
  return {
    name: item.name,
    artist: item.artists?.[0]?.name || "Desconhecido",
    url: item.external_urls.spotify,
    image: item.album?.images?.[0]?.url || "",
    uri: item.uri,
  };
}

// Resolve uma sugestão {title, artist} da IA para uma faixa real do Spotify.
// A IA pode errar o nome exato, então tentamos achar o melhor match entre os
// resultados da busca antes de cair pro primeiro resultado.
export async function searchTrack(
  title: string,
  artist: string,
): Promise<ResolvedTrack | null> {
  const token = await getAccessToken();

  const response = await axios.get("https://api.spotify.com/v1/search", {
    headers: { Authorization: `Bearer ${token}` },
    params: {
      q: `track:"${title}" artist:"${artist}"`,
      type: "track",
      limit: 5,
    },
  });

  const items = (response.data?.tracks?.items ?? []).filter(
    (t: any) => t && t.name && t.external_urls?.spotify && t.uri,
  );

  if (items.length === 0) return null;

  const wantTitle = normalize(title);
  const wantArtist = normalize(artist);

  const exactMatch = items.find(
    (t: any) =>
      normalize(t.name) === wantTitle &&
      t.artists?.some((a: any) => normalize(a.name) === wantArtist),
  );

  if (exactMatch) return toResolvedTrack(exactMatch);

  const artistMatch = items.find((t: any) =>
    t.artists?.some((a: any) => normalize(a.name) === wantArtist),
  );

  return toResolvedTrack(artistMatch || items[0]);
}
