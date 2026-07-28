import { useState } from "react";
import { startSpotifyLogin } from "../utils/spotifyLogin";
import "./login.css";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSpotifyLogin() {
    try {
      setLoading(true);
      setError(null);

      await startSpotifyLogin();
    } catch {
      setError("Não foi possível iniciar o login com Spotify.");
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <img src="/logo.png" alt="" className="login-logo" />
        <h1>Sonely</h1>
        <p>entre com sua conta Spotify e descubra músicas pelo seu humor</p>

        {error ? <p className="loginError">{error}</p> : null}

        <button onClick={handleSpotifyLogin} disabled={loading}>
          {loading ? "redirecionando..." : "Entrar com Spotify"}
        </button>
      </div>
    </div>
  );
}
