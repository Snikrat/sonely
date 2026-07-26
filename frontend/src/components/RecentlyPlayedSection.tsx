import { useEffect, useState } from "react";
import { api } from "../services/api";
import type { ListeningClock, RecentTrackItem } from "../types/recommendation";
import { timeAgo } from "../utils/timeAgo";

function RecentlyPlayedSection() {
  const [tracks, setTracks] = useState<RecentTrackItem[]>([]);
  const [clock, setClock] = useState<ListeningClock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    api
      .get<{ tracks: RecentTrackItem[]; clock: ListeningClock }>(
        "/me/recently-played",
      )
      .then((res) => {
        if (active) {
          setTracks(res.data.tracks);
          setClock(res.data.clock);
        }
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <header className="hero">
        <p className="eyebrow">seu histórico</p>
        <h2 className="title">o que você ouviu por último</h2>
        <p className="subtitle">
          as faixas mais recentes tocadas no Spotify, com o horário em que
          você mais costuma ouvir música.
        </p>
      </header>

      <section className="resultCard">
        {clock && clock.peakHour !== null ? (
          <p className="emptyText" style={{ marginBottom: 12 }}>
            você mais ouve música à {clock.peakPeriod}, por volta das{" "}
            {clock.peakHour}h.
          </p>
        ) : null}

        {loading ? <p className="emptyText">carregando...</p> : null}

        {!loading && error ? (
          <p className="emptyText">não foi possível carregar o histórico.</p>
        ) : null}

        {!loading && !error && tracks.length === 0 ? (
          <p className="emptyText">nenhuma música ouvida recentemente.</p>
        ) : null}

        {!loading && !error && tracks.length > 0 ? (
          <div className="cardList">
            {tracks.map((track, index) => (
              <article className="musicCard" key={`${track.url}-${index}`}>
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
                  <span className="meterCaption">
                    {timeAgo(track.playedAt)}
                  </span>
                  <a
                    href={track.url}
                    target="_blank"
                    rel="noreferrer"
                    className="link"
                  >
                    ouvir no spotify
                  </a>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </>
  );
}

export default RecentlyPlayedSection;
