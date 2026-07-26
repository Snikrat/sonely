import { useState } from "react";
import InsightsSection from "../components/InsightsSection";
import {
  ClockIcon,
  JournalIcon,
  LibraryIcon,
  SparkleIcon,
  TrendingIcon,
} from "../components/icons";
import LibrarySection from "../components/LibrarySection";
import MoodJournalSection from "../components/MoodJournalSection";
import RecentlyPlayedSection from "../components/RecentlyPlayedSection";
import RecommendationForm from "../components/RecommendationForm";
import ResultSection from "../components/ResultSection";
import TopTracksSection from "../components/TopTracksSection";
import type { RecommendationResponse } from "../types/recommendation";

type Tab =
  | "recommend"
  | "topTracks"
  | "recentlyPlayed"
  | "insights"
  | "library"
  | "journal";

const MENU_OPTIONS: {
  value: Tab;
  label: string;
  Icon: typeof SparkleIcon;
}[] = [
  { value: "recommend", label: "recomendar", Icon: SparkleIcon },
  { value: "topTracks", label: "mais ouvidas", Icon: TrendingIcon },
  { value: "recentlyPlayed", label: "recente", Icon: ClockIcon },
  { value: "library", label: "biblioteca", Icon: LibraryIcon },
  { value: "journal", label: "diário", Icon: JournalIcon },
];

type HomeProps = {
  userName?: string | null;
  onLogout?: () => void;
};

function Home({ userName, onLogout }: HomeProps) {
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("recommend");

  return (
    <main className="app">
      <section className="container">
        <div className="topBar">
          <div className="brandBlock">
            <img src="/logo.png" alt="" className="brandIcon" />
            <div>
              <p className="brandLabel">sonely</p>
              <h2 className="brandTitle">seu app de recomendação</h2>
            </div>
          </div>

          <div className="topBarActions">
            <button
              className={
                tab === "insights"
                  ? "profileButton profileButtonActive"
                  : "profileButton"
              }
              type="button"
              onClick={() => setTab("insights")}
            >
              perfil
            </button>
          </div>
        </div>

        {tab === "recommend" ? (
          <>
            <header className="hero">
              <p className="eyebrow">descubra músicas pelo seu momento</p>

              <h1 className="title">
                descubra músicas pelo que você está sentindo
              </h1>

              <p className="subtitle">
                escreva como você está se sentindo e receba recomendações de
                músicas e playlists com base no seu humor.
              </p>
            </header>

            <RecommendationForm
              setData={setData}
              loading={loading}
              setLoading={setLoading}
            />

            <ResultSection data={data} loading={loading} />
          </>
        ) : null}

        {tab === "topTracks" ? <TopTracksSection /> : null}
        {tab === "recentlyPlayed" ? <RecentlyPlayedSection /> : null}
        {tab === "insights" ? (
          <InsightsSection userName={userName} onLogout={onLogout} />
        ) : null}
        {tab === "library" ? <LibrarySection /> : null}
        {tab === "journal" ? <MoodJournalSection /> : null}
      </section>

      <nav className="bottomNav">
        {MENU_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={
              option.value === tab
                ? "bottomNavTab bottomNavTabActive"
                : "bottomNavTab"
            }
            onClick={() => setTab(option.value)}
          >
            <option.Icon className="bottomNavIcon" />
            <span className="bottomNavLabel">{option.label}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}

export default Home;
