import { useEffect, useState } from "react";
import { api } from "../services/api";
import type { TrackItem } from "../types/recommendation";

type TimeRange = "short_term" | "medium_term" | "long_term";

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "short_term", label: "recente" },
  { value: "medium_term", label: "6 meses" },
  { value: "long_term", label: "sempre" },
];

function TopTracksSection() {
  const [timeRange, setTimeRange] = useState<TimeRange>("medium_term");
  const [tracks, setTracks] = useState<TrackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(false);

    api
      .get<{ tracks: TrackItem[] }>("/me/top-tracks", {
        params: { time_range: timeRange },
      })
      .then((res) => {
        if (active) setTracks(res.data.tracks);
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
  }, [timeRange]);

  return (
    <>
      <header className="hero">
        <p className="eyebrow">o que você mais ouve</p>
        <h2 className="title">suas músicas mais ouvidas</h2>
        <p className="subtitle">
          veja seu top faixas no Spotify, filtrando por período — recente,
          últimos 6 meses ou de sempre.
        </p>
      </header>

      <section className="resultCard">
        <div className="timeRangeTabs">
          {TIME_RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={
                option.value === timeRange
                  ? "timeRangeTab timeRangeTabActive"
                  : "timeRangeTab"
              }
              onClick={() => setTimeRange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {loading ? <p className="emptyText">carregando...</p> : null}

        {!loading && error ? (
          <p className="emptyText">não foi possível carregar suas músicas.</p>
        ) : null}

        {!loading && !error && tracks.length === 0 ? (
          <p className="emptyText">
            nenhuma música encontrada nesse período.
          </p>
        ) : null}

        {!loading && !error && tracks.length > 0 ? (
          <div className="cardList">
            {tracks.map((track, index) => (
              <article className="musicCard" key={track.url}>
                <span className="rankBadge">#{index + 1}</span>

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

export default TopTracksSection;
