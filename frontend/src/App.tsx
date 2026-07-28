import { useEffect, useState } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import { api } from "./services/api";

function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [resolvingCallback, setResolvingCallback] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const error = params.get("error");

    if (code && state) {
      window.history.replaceState({}, "", window.location.pathname);
      finishSpotifyLogin(code, state);
      return;
    }

    if (error) {
      window.history.replaceState({}, "", window.location.pathname);
    }

    setIsAuth(!!localStorage.getItem("token"));
    setUserName(localStorage.getItem("userName"));
    setResolvingCallback(false);
  }, []);

  async function finishSpotifyLogin(code: string, state: string) {
    try {
      const savedState = sessionStorage.getItem("spotify_oauth_state");

      if (!savedState || savedState !== state) {
        throw new Error("state inválido");
      }

      const res = await api.post<{
        token: string;
        user: { displayName: string | null };
      }>("/auth/spotify/callback", {
        code,
        state,
      });

      localStorage.setItem("token", res.data.token);

      if (res.data.user.displayName) {
        localStorage.setItem("userName", res.data.user.displayName);
        setUserName(res.data.user.displayName);
      }

      setIsAuth(true);
    } catch (error) {
      console.error("Erro ao concluir login com Spotify:", error);
      setIsAuth(false);
    } finally {
      sessionStorage.removeItem("spotify_oauth_state");
      window.history.replaceState({}, "", window.location.pathname);
      setResolvingCallback(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    setIsAuth(false);
    setUserName(null);
  }

  if (resolvingCallback) {
    return null;
  }

  if (!isAuth) {
    return <Login />;
  }

  return <Home userName={userName} onLogout={handleLogout} />;
}

export default App;
