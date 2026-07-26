import { describe, expect, it } from "vitest";
import { rankTracks } from "./ranking";

describe("rankTracks", () => {
  it("retorna lista vazia para entrada vazia", () => {
    expect(rankTracks([], [], [], [], [])).toEqual([]);
  });

  it("pontua por gênero sugerido no nome ou artista", () => {
    const tracks = [{ name: "Rock Anthem", artist: "Foo" }];
    const [result] = rankTracks(tracks, ["rock"], [], [], []);
    expect(result.score).toBe(2);
  });

  it("pontua por vibe no nome da faixa", () => {
    const tracks = [{ name: "Calm Night", artist: "Foo" }];
    const [result] = rankTracks(tracks, [], ["calm"], [], []);
    expect(result.score).toBe(1);
  });

  it("pontua por gênero do perfil do usuário", () => {
    const tracks = [{ name: "Funk Hits", artist: "Foo" }];
    const [result] = rankTracks(tracks, [], [], [], ["funk"]);
    expect(result.score).toBe(2);
  });

  it("dá bônus forte quando o artista é um top artist do usuário", () => {
    const tracks = [{ name: "Whatever", artist: "Coldplay" }];
    const [result] = rankTracks(tracks, [], [], [], [], ["Coldplay"]);
    expect(result.score).toBe(4);
  });

  it("dá bônus ainda maior quando a faixa já está no top tracks do usuário", () => {
    const tracks = [{ name: "Yellow", artist: "Coldplay" }];
    const [result] = rankTracks(
      tracks,
      [],
      [],
      [],
      [],
      [],
      [{ name: "Yellow", artist: "Coldplay" }],
    );
    expect(result.score).toBe(6);
  });

  it("penaliza termos a evitar", () => {
    const tracks = [{ name: "Sad Ballad", artist: "Foo" }];
    const [result] = rankTracks(tracks, [], [], ["sad"], []);
    expect(result.score).toBe(-3);
  });

  it("aplica bônus de feedback positivo e penalidade de feedback negativo", () => {
    const tracks = [
      { name: "Track A", artist: "Artist A" },
      { name: "Track B", artist: "Artist B" },
    ];
    const feedback = {
      "track a|artist a": 1,
      "track b|artist b": -1,
    };

    const result = rankTracks(tracks, [], [], [], [], [], [], feedback);

    const trackA = result.find((t) => t.name === "Track A")!;
    const trackB = result.find((t) => t.name === "Track B")!;

    expect(trackA.score).toBe(8);
    expect(trackA.feedback).toBe(1);
    expect(trackB.score).toBe(-8);
    expect(trackB.feedback).toBe(-1);
  });

  it("ordena por score decrescente", () => {
    const tracks = [
      { name: "Low", artist: "Foo" },
      { name: "High Rock", artist: "Foo" },
    ];

    const result = rankTracks(tracks, ["rock"], [], [], []);

    expect(result.map((t) => t.name)).toEqual(["High Rock", "Low"]);
  });
});
