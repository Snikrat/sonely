import { useState } from "react";
import { api } from "../services/api";
import type {
  CreatePlaylistResponse,
  GenerateDescriptionResponse,
  GeneratePlaylistResponse,
  TrackItem,
} from "../types/recommendation";
import { startSpotifyLogin } from "../utils/spotifyLogin";
import Modal from "./Modal";

type PlaylistGeneratorModalProps = {
  prompt: string;
  initialTracks: TrackItem[];
  onClose: () => void;
};

type Step = "select" | "review";

type CreateError = {
  message: string;
  needsReconnect: boolean;
};

function trackKey(track: TrackItem) {
  return `${track.name}|${track.artist}`.toLowerCase();
}

function dedupeTracks(tracks: TrackItem[]) {
  const seen = new Set<string>();
  const result: TrackItem[] = [];

  tracks.forEach((track) => {
    const key = trackKey(track);
    if (seen.has(key)) return;
    seen.add(key);
    result.push(track);
  });

  return result;
}

function PlaylistGeneratorModal({
  prompt,
  initialTracks,
  onClose,
}: PlaylistGeneratorModalProps) {
  const [step, setStep] = useState<Step>("select");
  const [tracks, setTracks] = useState<TrackItem[]>(initialTracks);
  const [keptKeys, setKeptKeys] = useState<Set<string>>(new Set());
  const [seenTracks, setSeenTracks] = useState<TrackItem[]>(initialTracks);
  const [regenLoading, setRegenLoading] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);
  const [descLoading, setDescLoading] = useState(false);
  const [descError, setDescError] = useState<string | null>(null);
  const [playlistName, setPlaylistName] = useState("SONELY PLAYLIST");
  const [description, setDescription] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<CreateError | null>(null);
  const [result, setResult] = useState<CreatePlaylistResponse | null>(null);

  function toggleKeep(track: TrackItem) {
    const key = trackKey(track);

    setKeptKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  async function handleRegenerate() {
    try {
      setRegenLoading(true);
      setRegenError(null);

      const keep = tracks.filter((track) => keptKeys.has(trackKey(track)));

      const response = await api.post<GeneratePlaylistResponse>(
        "/playlist/generate",
        { prompt, keep, exclude: seenTracks },
      );

      setTracks(response.data.tracks);
      setSeenTracks((prev) =>
        dedupeTracks([...prev, ...response.data.tracks]),
      );
    } catch (err) {
      console.error("Erro ao gerar novamente:", err);
      setRegenError("Não foi possível gerar novas sugestões agora.");
    } finally {
      setRegenLoading(false);
    }
  }

  async function handleContinue() {
    try {
      setDescLoading(true);
      setDescError(null);

      const response = await api.post<GenerateDescriptionResponse>(
        "/playlist/description",
        { prompt, tracks },
      );

      setDescription(response.data.description);
      setStep("review");
    } catch (err) {
      console.error("Erro ao gerar descrição:", err);
      setDescError("Não foi possível gerar a descrição agora.");
    } finally {
      setDescLoading(false);
    }
  }

  async function handleCreate() {
    try {
      setCreateLoading(true);
      setCreateError(null);

      const response = await api.post<CreatePlaylistResponse>(
        "/playlist/create",
        { name: playlistName, description, tracks, prompt },
      );

      setResult(response.data);
    } catch (err: any) {
      console.error("Erro ao criar playlist:", err);

      if (
        err?.response?.status === 403 &&
        err.response.data?.code === "insufficient_scope"
      ) {
        setCreateError({
          message: err.response.data.error,
          needsReconnect: true,
        });
      } else {
        setCreateError({
          message: "Não foi possível criar a playlist agora.",
          needsReconnect: false,
        });
      }
    } finally {
      setCreateLoading(false);
    }
  }

  if (result) {
    return (
      <Modal title="playlist criada!" onClose={onClose}>
        <div className="resultCard">
          <p className="resultMessage">{result.description}</p>

          <a
            href={result.url}
            target="_blank"
            rel="noreferrer"
            className="link"
          >
            abrir "{result.name}" no spotify
          </a>
        </div>
      </Modal>
    );
  }

  if (step === "review") {
    return (
      <Modal
        title="revise sua playlist"
        onClose={onClose}
        footer={
          <div className="modalActionsRow">
            <button
              type="button"
              className="buttonSecondary"
              onClick={() => setStep("select")}
              disabled={createLoading}
            >
              voltar
            </button>

            <button
              type="button"
              className="button"
              onClick={handleCreate}
              disabled={createLoading}
            >
              {createLoading ? "criando..." : "criar playlist"}
            </button>
          </div>
        }
      >
        <label className="label" htmlFor="playlistName">
          nome da playlist
        </label>

        <input
          id="playlistName"
          className="textInput"
          value={playlistName}
          onChange={(e) => setPlaylistName(e.target.value)}
        />

        <label className="label" htmlFor="playlistDescription">
          descrição
        </label>

        <textarea
          id="playlistDescription"
          className="textarea textareaSmall"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={300}
          rows={4}
        />

        {createError ? (
          <div className="resultMessage">
            <p>{createError.message}</p>

            {createError.needsReconnect ? (
              <button
                type="button"
                className="button"
                onClick={() => startSpotifyLogin()}
              >
                reconectar com spotify
              </button>
            ) : null}
          </div>
        ) : null}
      </Modal>
    );
  }

  return (
    <Modal
      title="sua playlist gerada"
      onClose={onClose}
      footer={
        <div className="modalActionsRow">
          <button
            type="button"
            className="buttonSecondary"
            onClick={handleRegenerate}
            disabled={regenLoading || descLoading}
          >
            {regenLoading ? "gerando..." : "gerar novamente"}
          </button>

          <button
            type="button"
            className="button"
            onClick={handleContinue}
            disabled={regenLoading || descLoading}
          >
            {descLoading ? "preparando..." : "continuar"}
          </button>
        </div>
      }
    >
      <p className="resultMessage">
        marque as músicas que você mais gostou e clique em "gerar novamente"
        pra trocar o restante. quando estiver satisfeito, continue pra criar
        a playlist no seu Spotify.
      </p>

      <div className="cardList">
        {tracks.map((track) => {
          const key = trackKey(track);
          const kept = keptKeys.has(key);

          return (
            <article className="musicCard" key={key}>
              {track.image ? (
                <img className="cover" src={track.image} alt={track.name} />
              ) : null}

              <div className="cardContent">
                <strong>{track.name}</strong>
                <span>{track.artist}</span>

                <div className="cardFooterRow">
                  <a
                    href={track.url}
                    target="_blank"
                    rel="noreferrer"
                    className="link"
                  >
                    ouvir no spotify
                  </a>

                  <button
                    type="button"
                    className={
                      kept ? "keepButton keepButtonActive" : "keepButton"
                    }
                    aria-label={
                      kept ? "não manter essa música" : "manter essa música"
                    }
                    onClick={() => toggleKeep(track)}
                  >
                    {kept ? "★ mantida" : "☆ manter"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {regenError ? <p className="resultMessage">{regenError}</p> : null}
      {descError ? <p className="resultMessage">{descError}</p> : null}
    </Modal>
  );
}

export default PlaylistGeneratorModal;
