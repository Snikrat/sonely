import { useEffect, useState } from "react";
import { api } from "../services/api";
import type { RecommendationResponse, TrackItem } from "../types/recommendation";

type ResultSectionProps = {
  data: RecommendationResponse | null;
  loading: boolean;
};

function trackKey(track: TrackItem) {
  return `${track.name}|${track.artist}`;
}

function ResultSection({ data, loading }: ResultSectionProps) {
  const [feedbackMap, setFeedbackMap] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!data) return;

    const initial: Record<string, number> = {};
    data.tracks.forEach((track) => {
      initial[trackKey(track)] = track.feedback ?? 0;
    });
    setFeedbackMap(initial);
  }, [data]);

  function sendFeedback(track: TrackItem, rating: 1 | -1) {
    const key = trackKey(track);
    const current = feedbackMap[key] ?? 0;
    const nextRating = current === rating ? 0 : rating;

    setFeedbackMap((prev) => ({ ...prev, [key]: nextRating }));

    api
      .post("/recommend/feedback", {
        trackName: track.name,
        artistName: track.artist,
        rating: nextRating,
      })
      .catch(() => {
        setFeedbackMap((prev) => ({ ...prev, [key]: current }));
      });
  }

  if (loading) {
    return (
      <section className="resultCard">
        <p className="resultMessage">buscando recomendações...</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="resultCard">
        <p className="resultMessage">suas recomendações vão aparecer aqui.</p>
      </section>
    );
  }

  return (
    <section className="resultWrapper">
      <div className="resultCard">
        <h2 className="sectionTitle">mensagem</h2>
        <p className="resultMessage">{data.message}</p>
      </div>

      <div className="resultCard">
        <h2 className="sectionTitle">playlists</h2>

        {data.playlists.length === 0 ? (
          <p className="emptyText">nenhuma playlist encontrada.</p>
        ) : (
          <div className="cardList">
            {data.playlists.map((playlist) => (
              <article className="musicCard" key={playlist.url}>
                {playlist.image ? (
                  <img
                    className="cover"
                    src={playlist.image}
                    alt={playlist.name}
                  />
                ) : null}

                <div className="cardContent">
                  <strong>{playlist.name}</strong>
                  <a
                    href={playlist.url}
                    target="_blank"
                    rel="noreferrer"
                    className="link"
                  >
                    abrir no spotify
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="resultCard">
        <h2 className="sectionTitle">músicas</h2>

        {data.tracks.length === 0 ? (
          <p className="emptyText">nenhuma música encontrada.</p>
        ) : (
          <div className="cardList">
            {data.tracks.map((track) => {
              const rating = feedbackMap[trackKey(track)] ?? 0;

              return (
                <article className="musicCard" key={track.url}>
                  {track.image ? (
                    <img
                      className="cover"
                      src={track.image}
                      alt={track.name}
                    />
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

                      <div className="feedbackButtons">
                        <button
                          type="button"
                          className={
                            rating === 1
                              ? "feedbackButton feedbackButtonLikeActive"
                              : "feedbackButton"
                          }
                          aria-label="gostei dessa recomendação"
                          onClick={() => sendFeedback(track, 1)}
                        >
                          👍
                        </button>
                        <button
                          type="button"
                          className={
                            rating === -1
                              ? "feedbackButton feedbackButtonDislikeActive"
                              : "feedbackButton"
                          }
                          aria-label="não gostei dessa recomendação"
                          onClick={() => sendFeedback(track, -1)}
                        >
                          👎
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default ResultSection;
