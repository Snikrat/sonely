import { useState } from "react";
import { api } from "../services/api";
import type { GeneratePlaylistResponse, TrackItem } from "../types/recommendation";
import PlaylistGeneratorModal from "./PlaylistGeneratorModal";

function PlaylistGeneratorForm() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tracks, setTracks] = useState<TrackItem[] | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!prompt.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const response = await api.post<GeneratePlaylistResponse>(
        "/playlist/generate",
        { prompt, keep: [], exclude: [] },
      );

      setTracks(response.data.tracks);
    } catch (err) {
      console.error("Erro ao gerar playlist:", err);
      setError("Não foi possível gerar a playlist agora.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form className="formCard" onSubmit={handleSubmit}>
        <label className="label" htmlFor="playlistPrompt">
          descreva a playlist que você quer criar
        </label>

        <textarea
          id="playlistPrompt"
          className="textarea"
          placeholder="ex: playlist pra treinar de manhã, com pop e funk animado, tipo Anitta e Dua Lipa, considerando também o que eu já costumo ouvir..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={6}
        />

        {error ? <p className="resultMessage">{error}</p> : null}

        <button className="button" type="submit" disabled={loading}>
          {loading ? "gerando..." : "gerar playlist"}
        </button>
      </form>

      {tracks ? (
        <PlaylistGeneratorModal
          prompt={prompt}
          initialTracks={tracks}
          onClose={() => setTracks(null)}
        />
      ) : null}
    </>
  );
}

export default PlaylistGeneratorForm;
