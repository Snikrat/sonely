export type PlaylistItem = {
  name: string;
  url: string;
  image?: string;
};

export type TrackItem = {
  name: string;
  artist: string;
  url: string;
  image?: string;
  feedback?: number;
  addedAt?: string;
};

export type RecommendationResponse = {
  message: string;
  playlists: PlaylistItem[];
  tracks: TrackItem[];
};

export type MoodJournalEntry = {
  id: string;
  message: string;
  emotion: {
    sentimento_atual: string;
    energia_atual: "baixa" | "media" | "alta";
    objetivo: string;
    vibes: string[];
    generos_sugeridos: string[];
    evitar: string[];
  };
  createdAt: string;
};

export type RecentTrackItem = TrackItem & {
  playedAt: string;
};

export type PlaylistSummary = {
  name: string;
  url: string;
  image?: string;
  tracksTotal: number;
  owner: string;
};

export type ArtistRef = {
  name: string;
  url: string;
  image?: string;
};

export type LibrarySummary = {
  likedSongsCount: number;
  likedSongs: TrackItem[];
  likePeakDay: string | null;
  followedArtistsCount: number;
  followedArtists: ArtistRef[];
  followedArtistsNextCursor: string | null;
  playlists: PlaylistSummary[];
};

export type TrackHighlight = {
  name: string;
  artist: string;
};

export type Insights = {
  explicitPercentage: number;
  avgDurationMs: number;
  decades: { decade: string; count: number }[];
  consistentArtists: ArtistRef[];
  mostRepeatedWord: { word: string; count: number } | null;
  diversityPercentage: number;
  favoriteAlbum: { album: string; count: number } | null;
  oldestTrack: TrackHighlight | null;
  newestTrack: TrackHighlight | null;
  longestTrack: TrackHighlight | null;
  shortestTrack: TrackHighlight | null;
  topArtist: { name: string; count: number } | null;
  longestTitleTrack: TrackHighlight | null;
  shortestTitleTrack: TrackHighlight | null;
  totalListeningMs: number;
};

export type MoodStats = {
  energyDistribution: { baixa: number; media: number; alta: number };
  topGeneros: { genero: string; count: number }[];
};

export type HistoryStats = {
  totalCount: number;
  currentStreak: number;
  topObjetivo: { objetivo: string; count: number } | null;
};

export type FeedbackStats = {
  total: number;
  likes: number;
  dislikes: number;
  likeRate: number | null;
};

export type ListeningClock = {
  peakHour: number | null;
  peakPeriod: string | null;
};
