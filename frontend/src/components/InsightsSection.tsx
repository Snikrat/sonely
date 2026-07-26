import { useEffect, useState } from "react";
import { api } from "../services/api";
import type { FeedbackStats, Insights } from "../types/recommendation";
import { canvasToBlob, generateRecapCanvas } from "../utils/recapCard";

const canShareFiles =
  typeof navigator !== "undefined" &&
  !!navigator.canShare &&
  navigator.canShare({
    files: [new File([], "test.png", { type: "image/png" })],
  });

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatHoursMinutes(ms: number) {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}min`;
  return `${hours}h ${minutes}min`;
}

type InsightsSectionProps = {
  userName?: string | null;
  onLogout?: () => void;
};

function InsightsSection({ userName, onLogout }: InsightsSectionProps) {
  const [data, setData] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [recapCanvas, setRecapCanvas] = useState<HTMLCanvasElement | null>(
    null,
  );
  const [recapUrl, setRecapUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(
    null,
  );

  useEffect(() => {
    let active = true;

    api
      .get<Insights>("/me/insights")
      .then((res) => {
        if (active) setData(res.data);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    api
      .get<FeedbackStats>("/recommend/feedback/stats")
      .then((res) => {
        if (active) setFeedbackStats(res.data);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const hero = (
    <header className="hero">
      <p className="eyebrow">suas estatísticas</p>
      <h2 className="title">seu perfil musical</h2>
      <p className="subtitle">
        curiosidades e números sobre o que você mais ouve, com base no seu
        Spotify.
      </p>
    </header>
  );

  if (loading) {
    return (
      <>
        {hero}
        <section className="resultWrapper">
          <div className="resultCard">
            <p className="emptyText">carregando...</p>
          </div>

          {onLogout ? (
            <button className="logoutButton" type="button" onClick={onLogout}>
              sair
            </button>
          ) : null}
        </section>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        {hero}
        <section className="resultWrapper">
          <div className="resultCard">
            <p className="emptyText">
              não foi possível calcular suas estatísticas.
            </p>
          </div>

          {onLogout ? (
            <button className="logoutButton" type="button" onClick={onLogout}>
              sair
            </button>
          ) : null}
        </section>
      </>
    );
  }

  const maxDecadeCount = Math.max(1, ...data.decades.map((d) => d.count));

  function handleGenerateRecap() {
    const canvas = generateRecapCanvas(userName ?? "", data as Insights);
    setRecapCanvas(canvas);
    setRecapUrl(canvas.toDataURL("image/png"));
  }

  async function handleShare() {
    if (!recapCanvas) return;

    const blob = await canvasToBlob(recapCanvas);
    if (!blob) return;

    const file = new File([blob], "sonely-recap.png", { type: "image/png" });

    try {
      setSharing(true);
      await navigator.share({
        files: [file],
        title: "Sonely",
        text: "meu perfil musical no Sonely",
      });
    } catch {
      // usuário cancelou o compartilhamento, ou o navegador recusou — sem tratamento necessário
    } finally {
      setSharing(false);
    }
  }

  return (
    <>
      {hero}
      <section className="resultWrapper">
      <div className="resultCard">
        <h2 className="sectionTitle">visão geral</h2>

        <div className="meterRow">
          <div className="meterTrack">
            <div
              className="meterFill"
              style={{ width: `${data.explicitPercentage}%` }}
            />
          </div>
          <span className="meterCaption">
            {data.explicitPercentage}% das suas faixas são explícitas
          </span>
        </div>

        <div className="statRow">
          <div className="statTile">
            <span className="statValue">{formatDuration(data.avgDurationMs)}</span>
            <span className="statLabel">duração média das faixas</span>
          </div>

          <div className="statTile">
            <span className="statValue">{data.diversityPercentage}%</span>
            <span className="statLabel">diversidade de artistas</span>
          </div>

          <div className="statTile">
            <span className="statValue">
              {formatHoursMinutes(data.totalListeningMs)}
            </span>
            <span className="statLabel">pra ouvir seu top 50</span>
          </div>

          {feedbackStats && feedbackStats.likeRate !== null ? (
            <div className="statTile">
              <span className="statValue">{feedbackStats.likeRate}%</span>
              <span className="statLabel">
                taxa de acerto das recomendações
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {data.mostRepeatedWord ||
      data.favoriteAlbum ||
      data.oldestTrack ||
      data.newestTrack ||
      data.longestTrack ||
      data.shortestTrack ||
      data.topArtist ||
      data.longestTitleTrack ||
      data.shortestTitleTrack ? (
        <div className="resultCard">
          <h2 className="sectionTitle">curiosidades</h2>

          <div className="highlightList">
            {data.topArtist ? (
              <div className="highlightRow">
                <span className="highlightLabel">artista mais repetido</span>
                <span className="highlightValue">
                  {data.topArtist.name} ({data.topArtist.count} faixas)
                </span>
              </div>
            ) : null}

            {data.mostRepeatedWord ? (
              <div className="highlightRow">
                <span className="highlightLabel">palavra mais repetida</span>
                <span className="highlightValue">
                  "{data.mostRepeatedWord.word}" ({data.mostRepeatedWord.count}x)
                </span>
              </div>
            ) : null}

            {data.favoriteAlbum ? (
              <div className="highlightRow">
                <span className="highlightLabel">álbum favorito</span>
                <span className="highlightValue">
                  {data.favoriteAlbum.album} ({data.favoriteAlbum.count}{" "}
                  faixas)
                </span>
              </div>
            ) : null}

            {data.oldestTrack ? (
              <div className="highlightRow">
                <span className="highlightLabel">faixa mais antiga</span>
                <span className="highlightValue">
                  {data.oldestTrack.name} · {data.oldestTrack.artist}
                </span>
              </div>
            ) : null}

            {data.newestTrack ? (
              <div className="highlightRow">
                <span className="highlightLabel">faixa mais recente</span>
                <span className="highlightValue">
                  {data.newestTrack.name} · {data.newestTrack.artist}
                </span>
              </div>
            ) : null}

            {data.longestTrack ? (
              <div className="highlightRow">
                <span className="highlightLabel">faixa mais longa</span>
                <span className="highlightValue">
                  {data.longestTrack.name} · {data.longestTrack.artist}
                </span>
              </div>
            ) : null}

            {data.shortestTrack ? (
              <div className="highlightRow">
                <span className="highlightLabel">faixa mais curta</span>
                <span className="highlightValue">
                  {data.shortestTrack.name} · {data.shortestTrack.artist}
                </span>
              </div>
            ) : null}

            {data.longestTitleTrack ? (
              <div className="highlightRow">
                <span className="highlightLabel">título mais longo</span>
                <span className="highlightValue">
                  {data.longestTitleTrack.name} ·{" "}
                  {data.longestTitleTrack.artist}
                </span>
              </div>
            ) : null}

            {data.shortestTitleTrack ? (
              <div className="highlightRow">
                <span className="highlightLabel">título mais curto</span>
                <span className="highlightValue">
                  {data.shortestTitleTrack.name} ·{" "}
                  {data.shortestTitleTrack.artist}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {data.decades.length > 0 ? (
        <div className="resultCard">
          <h2 className="sectionTitle">sua linha do tempo musical</h2>

          <div className="decadeChart">
            {data.decades.map((d) => (
              <div className="decadeRow" key={d.decade}>
                <span className="decadeLabel">{d.decade}</span>
                <div className="decadeTrack">
                  <div
                    className="decadeBar"
                    style={{ width: `${(d.count / maxDecadeCount) * 100}%` }}
                  />
                </div>
                <span className="decadeCount">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {data.consistentArtists.length > 0 ? (
        <div className="resultCard">
          <h2 className="sectionTitle">seus favoritos de sempre</h2>
          <p className="emptyText">
            artistas que aparecem no seu top em qualquer período — recente, 6
            meses e sempre.
          </p>

          <div className="chipList">
            {data.consistentArtists.map((artist) =>
              artist.url ? (
                <a
                  href={artist.url}
                  target="_blank"
                  rel="noreferrer"
                  className="chip"
                  key={artist.name}
                >
                  {artist.name}
                </a>
              ) : (
                <span className="chip" key={artist.name}>
                  {artist.name}
                </span>
              ),
            )}
          </div>
        </div>
      ) : null}

      <div className="resultCard">
        <h2 className="sectionTitle">recap compartilhável</h2>
        <p className="emptyText">
          gere uma imagem com o resumo do seu perfil musical pra compartilhar.
        </p>

        <button type="button" className="button" onClick={handleGenerateRecap}>
          gerar recap
        </button>

        {recapUrl ? (
          <>
            <img
              src={recapUrl}
              alt="recap do seu perfil musical"
              className="recapPreview"
              style={{ marginTop: 12 }}
            />

            {canShareFiles ? (
              <button
                type="button"
                className="button"
                onClick={handleShare}
                disabled={sharing}
              >
                {sharing ? "compartilhando..." : "compartilhar"}
              </button>
            ) : null}

            <a
              href={recapUrl}
              download="sonely-recap.png"
              className="link"
              style={{ display: "block", marginTop: 8, textAlign: "center" }}
            >
              baixar imagem
            </a>
          </>
        ) : null}
      </div>

      {onLogout ? (
        <button className="logoutButton" type="button" onClick={onLogout}>
          sair
        </button>
      ) : null}
      </section>
    </>
  );
}

export default InsightsSection;
