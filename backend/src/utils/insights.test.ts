import { describe, expect, it } from "vitest";
import { computeInsights } from "./insights";

function track(overrides: Partial<{
  name: string;
  artist: string;
  album: string;
  explicit: boolean;
  releaseDate: string;
  durationMs: number;
}> = {}) {
  return {
    name: "Track",
    artist: "Artist",
    album: "Album",
    explicit: false,
    releaseDate: "2020-01-01",
    durationMs: 200000,
    ...overrides,
  };
}

describe("computeInsights", () => {
  it("retorna valores zerados quando não há faixas", () => {
    expect(computeInsights([], [], [], [])).toEqual({
      explicitPercentage: 0,
      avgDurationMs: 0,
      decades: [],
      consistentArtists: [],
      mostRepeatedWord: null,
      diversityPercentage: 0,
      favoriteAlbum: null,
      oldestTrack: null,
      newestTrack: null,
      longestTrack: null,
      shortestTrack: null,
      topArtist: null,
      longestTitleTrack: null,
      shortestTitleTrack: null,
      totalListeningMs: 0,
    });
  });

  it("calcula a porcentagem de faixas explícitas", () => {
    const tracks = [
      track({ explicit: true }),
      track({ explicit: true }),
      track({ explicit: false }),
      track({ explicit: false }),
    ];

    const result = computeInsights(tracks, [], [], []);

    expect(result.explicitPercentage).toBe(50);
  });

  it("calcula a duração média das faixas", () => {
    const tracks = [
      track({ durationMs: 100000 }),
      track({ durationMs: 300000 }),
    ];

    const result = computeInsights(tracks, [], [], []);

    expect(result.avgDurationMs).toBe(200000);
  });

  it("agrupa faixas por década e ordena cronologicamente", () => {
    const tracks = [
      track({ releaseDate: "1999-05-01" }),
      track({ releaseDate: "1995-01-01" }),
      track({ releaseDate: "2021-01-01" }),
      track({ releaseDate: "2023-01-01" }),
    ];

    const result = computeInsights(tracks, [], [], []);

    expect(result.decades).toEqual([
      { decade: "1990s", count: 2 },
      { decade: "2020s", count: 2 },
    ]);
  });

  it("ignora faixas sem data de lançamento válida no cálculo de décadas", () => {
    const tracks = [track({ releaseDate: "" }), track({ releaseDate: "2020-01-01" })];

    const result = computeInsights(tracks, [], [], []);

    expect(result.decades).toEqual([{ decade: "2020s", count: 1 }]);
  });

  it("encontra artistas que aparecem nos três períodos, ignorando maiúsculas/minúsculas", () => {
    const tracks = [track()];

    function artist(name: string) {
      return { name, url: `https://open.spotify.com/artist/${name}` };
    }

    const result = computeInsights(
      tracks,
      [artist("Artist A"), artist("Artist B")],
      [artist("artist a"), artist("Artist C")],
      [artist("ARTIST A"), artist("Artist D")],
    );

    expect(result.consistentArtists).toEqual([artist("artist a")]);
  });

  it("encontra a palavra mais repetida nos títulos, ignorando stopwords", () => {
    const tracks = [
      track({ name: "Love Story" }),
      track({ name: "Love Again" }),
      track({ name: "The Love of my life" }),
      track({ name: "Something Else" }),
    ];

    const result = computeInsights(tracks, [], [], []);

    expect(result.mostRepeatedWord).toEqual({ word: "love", count: 3 });
  });

  it("não retorna palavra repetida quando nenhuma palavra se repete", () => {
    const tracks = [track({ name: "Alpha" }), track({ name: "Beta" })];

    const result = computeInsights(tracks, [], [], []);

    expect(result.mostRepeatedWord).toBeNull();
  });

  it("calcula a diversidade de artistas", () => {
    const tracks = [
      track({ artist: "A" }),
      track({ artist: "A" }),
      track({ artist: "B" }),
      track({ artist: "C" }),
    ];

    const result = computeInsights(tracks, [], [], []);

    expect(result.diversityPercentage).toBe(75);
  });

  it("encontra o álbum favorito quando há repetição", () => {
    const tracks = [
      track({ album: "X" }),
      track({ album: "X" }),
      track({ album: "Y" }),
    ];

    const result = computeInsights(tracks, [], [], []);

    expect(result.favoriteAlbum).toEqual({ album: "X", count: 2 });
  });

  it("não retorna álbum favorito quando nenhum se repete", () => {
    const tracks = [track({ album: "X" }), track({ album: "Y" })];

    const result = computeInsights(tracks, [], [], []);

    expect(result.favoriteAlbum).toBeNull();
  });

  it("encontra a faixa mais antiga e mais nova", () => {
    const tracks = [
      track({ name: "New", artist: "B", releaseDate: "2023-01-01" }),
      track({ name: "Old", artist: "A", releaseDate: "1980-01-01" }),
      track({ name: "Mid", artist: "C", releaseDate: "2000-01-01" }),
    ];

    const result = computeInsights(tracks, [], [], []);

    expect(result.oldestTrack).toEqual({ name: "Old", artist: "A" });
    expect(result.newestTrack).toEqual({ name: "New", artist: "B" });
  });

  it("encontra a faixa mais longa e mais curta", () => {
    const tracks = [
      track({ name: "Short", artist: "A", durationMs: 60000 }),
      track({ name: "Long", artist: "B", durationMs: 500000 }),
      track({ name: "Mid", artist: "C", durationMs: 200000 }),
    ];

    const result = computeInsights(tracks, [], [], []);

    expect(result.shortestTrack).toEqual({ name: "Short", artist: "A" });
    expect(result.longestTrack).toEqual({ name: "Long", artist: "B" });
  });

  it("encontra o artista mais repetido no top quando há repetição", () => {
    const tracks = [
      track({ artist: "A" }),
      track({ artist: "A" }),
      track({ artist: "B" }),
    ];

    const result = computeInsights(tracks, [], [], []);

    expect(result.topArtist).toEqual({ name: "A", count: 2 });
  });

  it("não retorna artista mais repetido quando nenhum se repete", () => {
    const tracks = [track({ artist: "A" }), track({ artist: "B" })];

    const result = computeInsights(tracks, [], [], []);

    expect(result.topArtist).toBeNull();
  });

  it("encontra o título mais longo e mais curto", () => {
    const tracks = [
      track({ name: "Oi", artist: "A" }),
      track({ name: "Um Título Bem Mais Longo Que Os Outros", artist: "B" }),
      track({ name: "Médio", artist: "C" }),
    ];

    const result = computeInsights(tracks, [], [], []);

    expect(result.shortestTitleTrack).toEqual({ name: "Oi", artist: "A" });
    expect(result.longestTitleTrack).toEqual({
      name: "Um Título Bem Mais Longo Que Os Outros",
      artist: "B",
    });
  });

  it("soma a duração total das faixas", () => {
    const tracks = [
      track({ durationMs: 100000 }),
      track({ durationMs: 250000 }),
    ];

    const result = computeInsights(tracks, [], [], []);

    expect(result.totalListeningMs).toBe(350000);
  });
});
