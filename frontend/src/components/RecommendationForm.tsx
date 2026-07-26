import { useState } from "react";
import type { RecommendationResponse } from "../types/recommendation";
import { api } from "../services/api";

type RecommendationFormProps = {
  setData: React.Dispatch<React.SetStateAction<RecommendationResponse | null>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

function RecommendationForm({
  setData,
  loading,
  setLoading,
}: RecommendationFormProps) {
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!message.trim()) return;

    try {
      setLoading(true);

      const response = await api.post<RecommendationResponse>("/recommend", {
        message,
      });

      setData(response.data);
    } catch (error) {
      console.error("Erro ao buscar recomendação:", error);

      setData({
        message: "Não foi possível buscar recomendações agora.",
        playlists: [],
        tracks: [],
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="formCard" onSubmit={handleSubmit}>
      <label className="label" htmlFor="message">
        como você está se sentindo?
      </label>

      <textarea
        id="message"
        className="textarea"
        placeholder="ex: hoje eu tô cansado, meio ansioso e queria ouvir algo mais leve pra relaxar..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={6}
      />

      <button className="button" type="submit" disabled={loading}>
        {loading ? "carregando..." : "me recomendar"}
      </button>
    </form>
  );
}

export default RecommendationForm;
