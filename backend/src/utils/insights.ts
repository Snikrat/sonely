type DetailedTrack = {
  name: string;
  artist: string;
  album: string;
  explicit: boolean;
  releaseDate: string;
  durationMs: number;
};

type TrackHighlight = {
  name: string;
  artist: string;
};

type ArtistRef = {
  name: string;
  url: string;
};

// Palavras comuns demais (PT/EN) e ruído típico de título de faixa, que a
// gente ignora pra "palavra mais repetida" não virar "de"/"feat"/"remix".
const STOPWORDS = new Set([
  "de", "da", "do", "das", "dos", "e", "a", "o", "os", "as", "um", "uma",
  "uns", "umas", "no", "na", "nos", "nas", "ao", "aos", "com", "pra", "para",
  "por", "em", "que", "se", "é", "sou", "meu", "minha", "seu", "sua", "the",
  "of", "in", "on", "my", "feat", "ft", "remix", "part", "version", "edit",
  "live", "acoustic", "radio", "to", "and", "or", "is", "it", "you", "me",
  "we", "your",
]);

function findMostRepeatedWord(tracks: DetailedTrack[]) {
  const counts = new Map<string, number>();

  tracks.forEach((t) => {
    const words = t.name.toLowerCase().match(/\p{L}+/gu) ?? [];

    words.forEach((word) => {
      if (word.length < 3 || STOPWORDS.has(word)) return;
      counts.set(word, (counts.get(word) ?? 0) + 1);
    });
  });

  let best: { word: string; count: number } | null = null;

  counts.forEach((count, word) => {
    if (count > 1 && (!best || count > best.count)) {
      best = { word, count };
    }
  });

  return best;
}

function findFavoriteAlbum(tracks: DetailedTrack[]) {
  const counts = new Map<string, number>();

  tracks.forEach((t) => {
    if (!t.album) return;
    counts.set(t.album, (counts.get(t.album) ?? 0) + 1);
  });

  let best: { album: string; count: number } | null = null;

  counts.forEach((count, album) => {
    if (count > 1 && (!best || count > best.count)) {
      best = { album, count };
    }
  });

  return best;
}

function toHighlight(track: DetailedTrack): TrackHighlight {
  return { name: track.name, artist: track.artist };
}

function findTopArtist(tracks: DetailedTrack[]) {
  const counts = new Map<string, number>();

  tracks.forEach((t) => {
    counts.set(t.artist, (counts.get(t.artist) ?? 0) + 1);
  });

  let best: { name: string; count: number } | null = null;

  counts.forEach((count, name) => {
    if (count > 1 && (!best || count > best.count)) {
      best = { name, count };
    }
  });

  return best;
}

export function computeInsights(
  tracks: DetailedTrack[],
  artistsShort: ArtistRef[],
  artistsMedium: ArtistRef[],
  artistsLong: ArtistRef[],
) {
  if (tracks.length === 0) {
    return {
      explicitPercentage: 0,
      avgDurationMs: 0,
      decades: [] as { decade: string; count: number }[],
      consistentArtists: [] as ArtistRef[],
      mostRepeatedWord: null as { word: string; count: number } | null,
      diversityPercentage: 0,
      favoriteAlbum: null as { album: string; count: number } | null,
      oldestTrack: null as TrackHighlight | null,
      newestTrack: null as TrackHighlight | null,
      longestTrack: null as TrackHighlight | null,
      shortestTrack: null as TrackHighlight | null,
      topArtist: null as { name: string; count: number } | null,
      longestTitleTrack: null as TrackHighlight | null,
      shortestTitleTrack: null as TrackHighlight | null,
      totalListeningMs: 0,
    };
  }

  const explicitPercentage = Math.round(
    (tracks.filter((t) => t.explicit).length / tracks.length) * 100,
  );

  const avgDurationMs = Math.round(
    tracks.reduce((sum, t) => sum + t.durationMs, 0) / tracks.length,
  );

  const decadeCounts = new Map<string, number>();

  tracks.forEach((t) => {
    const year = parseInt(t.releaseDate.slice(0, 4), 10);

    if (!year || Number.isNaN(year)) return;

    const decade = `${Math.floor(year / 10) * 10}s`;
    decadeCounts.set(decade, (decadeCounts.get(decade) ?? 0) + 1);
  });

  const decades = Array.from(decadeCounts.entries())
    .map(([decade, count]) => ({ decade, count }))
    .sort((a, b) => a.decade.localeCompare(b.decade));

  const shortNorm = new Set(artistsShort.map((a) => a.name.toLowerCase()));
  const longNorm = new Set(artistsLong.map((a) => a.name.toLowerCase()));

  const consistentArtists = artistsMedium.filter(
    (a) =>
      shortNorm.has(a.name.toLowerCase()) && longNorm.has(a.name.toLowerCase()),
  );

  const uniqueArtists = new Set(tracks.map((t) => t.artist.toLowerCase()));
  const diversityPercentage = Math.round(
    (uniqueArtists.size / tracks.length) * 100,
  );

  const withReleaseDate = tracks.filter((t) => t.releaseDate);
  let oldestTrack: TrackHighlight | null = null;
  let newestTrack: TrackHighlight | null = null;

  if (withReleaseDate.length > 0) {
    const byDate = [...withReleaseDate].sort((a, b) =>
      a.releaseDate.localeCompare(b.releaseDate),
    );
    oldestTrack = toHighlight(byDate[0]);
    newestTrack = toHighlight(byDate[byDate.length - 1]);
  }

  const byDuration = [...tracks].sort((a, b) => a.durationMs - b.durationMs);
  const shortestTrack = toHighlight(byDuration[0]);
  const longestTrack = toHighlight(byDuration[byDuration.length - 1]);

  const byTitleLength = [...tracks].sort(
    (a, b) => a.name.length - b.name.length,
  );
  const shortestTitleTrack = toHighlight(byTitleLength[0]);
  const longestTitleTrack = toHighlight(byTitleLength[byTitleLength.length - 1]);

  const totalListeningMs = tracks.reduce((sum, t) => sum + t.durationMs, 0);

  return {
    explicitPercentage,
    avgDurationMs,
    decades,
    consistentArtists,
    mostRepeatedWord: findMostRepeatedWord(tracks),
    diversityPercentage,
    favoriteAlbum: findFavoriteAlbum(tracks),
    oldestTrack,
    newestTrack,
    longestTrack,
    shortestTrack,
    topArtist: findTopArtist(tracks),
    longestTitleTrack,
    shortestTitleTrack,
    totalListeningMs,
  };
}
