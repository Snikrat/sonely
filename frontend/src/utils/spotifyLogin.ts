import { api } from "../services/api";

export async function startSpotifyLogin() {
  const res = await api.get<{ url: string; state: string }>(
    "/auth/spotify/login-url",
  );

  sessionStorage.setItem("spotify_oauth_state", res.data.state);
  window.location.href = res.data.url;
}
