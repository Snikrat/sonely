import { useEffect, useState } from "react";
import { api } from "../services/api";
import type {
  HistoryStats,
  MoodJournalEntry,
  MoodStats,
} from "../types/recommendation";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ENERGY_LABELS: { key: "baixa" | "media" | "alta"; label: string }[] = [
  { key: "baixa", label: "baixa" },
  { key: "media", label: "média" },
  { key: "alta", label: "alta" },
];

type MoodJournalResponse = {
  entries: MoodJournalEntry[];
  total: number;
  stats: MoodStats;
  historyStats: HistoryStats;
};

function MoodJournalSection() {
  const [entries, setEntries] = useState<MoodJournalEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<MoodStats | null>(null);
  const [historyStats, setHistoryStats] = useState<HistoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    api
      .get<MoodJournalResponse>("/mood-journal")
      .then((res) => {
        if (active) {
          setEntries(res.data.entries);
          setTotal(res.data.total);
          setStats(res.data.stats);
          setHistoryStats(res.data.historyStats);
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

  function loadMore() {
    if (loadingMore || entries.length >= total) return;

    setLoadingMore(true);

    api
      .get<MoodJournalResponse>("/mood-journal", {
        params: { offset: entries.length },
      })
      .then((res) => {
        setEntries((prev) => [...prev, ...res.data.entries]);
        setTotal(res.data.total);
      })
      .catch(() => setTotal(entries.length))
      .finally(() => setLoadingMore(false));
  }

  const hero = (
    <header className="hero">
      <p className="eyebrow">seu humor</p>
      <h2 className="title">seu diário de humor</h2>
      <p className="subtitle">
        um registro de como você tem se sentido e o que mais pediu nas suas
        conversas com o Sonely.
      </p>
    </header>
  );

  if (loading) {
    return (
      <>
        {hero}
        <section className="resultCard">
          <p className="emptyText">carregando...</p>
        </section>
      </>
    );
  }

  if (error) {
    return (
      <>
        {hero}
        <section className="resultCard">
          <p className="emptyText">não foi possível carregar seu diário.</p>
        </section>
      </>
    );
  }

  const maxEnergyCount = stats
    ? Math.max(1, ...ENERGY_LABELS.map((e) => stats.energyDistribution[e.key]))
    : 1;

  return (
    <>
      {hero}
      <section className="resultWrapper">
      {historyStats && historyStats.totalCount > 0 ? (
        <div className="resultCard">
          <h2 className="sectionTitle">seu ritmo</h2>

          <div className="statRow">
            <div className="statTile">
              <span className="statValue">{historyStats.totalCount}</span>
              <span className="statLabel">recomendações pedidas</span>
            </div>

            <div className="statTile">
              <span className="statValue">{historyStats.currentStreak}</span>
              <span className="statLabel">
                {historyStats.currentStreak === 1
                  ? "dia seguido usando"
                  : "dias seguidos usando"}
              </span>
            </div>
          </div>

          {historyStats.topObjetivo ? (
            <p className="emptyText" style={{ marginTop: 12 }}>
              o que você mais pede: "{historyStats.topObjetivo.objetivo}" (
              {historyStats.topObjetivo.count}x)
            </p>
          ) : null}
        </div>
      ) : null}

      {stats && entries.length > 0 ? (
        <div className="resultCard">
          <h2 className="sectionTitle">seu humor predominante</h2>

          <div className="decadeChart">
            {ENERGY_LABELS.map((e) => (
              <div className="decadeRow" key={e.key}>
                <span className="decadeLabel">{e.label}</span>
                <div className="decadeTrack">
                  <div
                    className="decadeBar"
                    style={{
                      width: `${
                        (stats.energyDistribution[e.key] / maxEnergyCount) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <span className="decadeCount">
                  {stats.energyDistribution[e.key]}
                </span>
              </div>
            ))}
          </div>

          {stats.topGeneros.length > 0 ? (
            <>
              <p className="emptyText" style={{ marginTop: 16 }}>
                gêneros mais pedidos nas suas conversas:
              </p>
              <div className="chipList">
                {stats.topGeneros.map((g) => (
                  <span className="chip" key={g.genero}>
                    {g.genero} ({g.count})
                  </span>
                ))}
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      <div className="resultCard">
        <h2 className="sectionTitle">suas conversas</h2>

        {entries.length === 0 ? (
          <p className="emptyText">
            suas próximas recomendações vão aparecer aqui como um diário.
          </p>
        ) : (
          <div className="cardList">
            {entries.map((entry) => (
              <article className="journalEntry" key={entry.id}>
                <span className="journalDate">
                  {formatDate(entry.createdAt)}
                </span>
                <p className="journalMessage">{entry.message}</p>

                <div className="journalTags">
                  <span className="journalTag">
                    {entry.emotion.sentimento_atual}
                  </span>
                  <span className="journalTag">
                    energia {entry.emotion.energia_atual}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}

        {entries.length < total ? (
          <button
            type="button"
            className="buttonSecondary"
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "carregando..." : "carregar mais"}
          </button>
        ) : null}
      </div>
      </section>
    </>
  );
}

export default MoodJournalSection;
